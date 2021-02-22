import isolate from "@cycle/isolate";
import {
  a,
  button,
  footer,
  h1,
  header,
  input,
  label,
  li,
  MainDOMSource,
  section,
  span,
  ul,
  VNode,
} from "@cycle/dom";
import { HistoryInput } from "@cycle/history";
import { makeCollection, Reducer, StateSource } from "@cycle/state";
import { ResponseCollection, StorageRequest } from "@cycle/storage";
import { Location } from "history";
import xs, { MemoryStream, Stream } from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import debounce from "xstream/extra/debounce";

import { Todo, TodoProps } from "../components/Todo";
import { safeJSONParse, safeJSONStringify } from "../utils";

export enum FilterType {
  All = "all",
  Active = "active",
  Completed = "completed",
}

export interface TodoPropsWithDOM extends TodoProps {
  DOM: VNode;
}

export interface AppState {
  filterType: FilterType;
  text: string;
  allTodoList: TodoPropsWithDOM[];
}

export type AppSources = {
  DOM: MainDOMSource;
  state: StateSource<AppState>;
  history: MemoryStream<Location>;
  storage: ResponseCollection;
};

export type AppSinks = {
  DOM: Stream<VNode>;
  state: Stream<Reducer<AppState>>;
  history: Stream<HistoryInput>;
  storage: Stream<StorageRequest>;
};

export interface TodoListSinks {
  DOM: Stream<VNode[]>;
  state: Stream<Reducer<TodoPropsWithDOM>>;
}

export const StorageKey = "todo-list";

function intent(domSource: MainDOMSource, history$: MemoryStream<Location>) {
  return {
    toggleAll$: domSource
      .select(".toggle-all + label")
      .events("click")
      .map(
        (ev) =>
          ((ev.target as HTMLLabelElement)
            .previousElementSibling as HTMLInputElement).checked
      ),
    inputText$: domSource
      .select(".new-todo")
      .events("input")
      .map((ev: Event) => (ev.target as HTMLInputElement).value),
    clearText$: domSource
      .select(".new-todo")
      .events("keydown")
      .filter((ev) => ev.key === "Escape")
      .map((ev) => (ev.target as HTMLInputElement).value),
    addTodo$: domSource
      .select(".new-todo")
      .events("keydown")
      .filter((ev) => ev.key === "Enter")
      .map((ev) => (ev.target as HTMLInputElement).value)
      .filter((value) => value.trim().length > 0),
    clearCompleted$: domSource.select(".clear-completed").events("click"),
    changeRoute$: history$
      .map((location) => location.pathname)
      .compose(dropRepeats()),
    changeFilterType$: domSource
      .select(".filters a")
      .events("click")
      .map((event: MouseEvent) =>
        (event.target as HTMLAnchorElement).hash.replace("#", "")
      ),
  };
}

const FilterFnMap = new Map<
  FilterType,
  (allTodoList: TodoPropsWithDOM[]) => TodoPropsWithDOM[]
>([
  [FilterType.All, (allTodoList) => allTodoList],
  [
    FilterType.Active,
    (allTodoList) => allTodoList.filter((todo) => !todo.isCompleted),
  ],
  [
    FilterType.Completed,
    (allTodoList) => allTodoList.filter((todo) => todo.isCompleted),
  ],
]);

function model(state$: Stream<AppState>) {
  return state$.map((state) => {
    const completedList = FilterFnMap.get(FilterType.Completed)(
      state.allTodoList
    );

    return {
      ...state,
      completedAmount: completedList.length,
      activeAmount: state.allTodoList.length - completedList.length,
    };
  });
}

function makeReducer$(
  actions: ReturnType<typeof intent>,
  todoListSinks: TodoListSinks,
  initialTodoListFromStorage$: Stream<TodoProps[]>
) {
  return xs.merge(
    xs.of((prevState?: AppState) => {
      if (typeof prevState === "undefined") {
        return {
          filterType: FilterType.All,
          text: "",
          allTodoList: [],
        };
      } else {
        return prevState;
      }
    }),
    initialTodoListFromStorage$.map((todoList) => (prevState) => ({
      ...prevState,
      allTodoList: todoList,
    })),
    actions.changeRoute$.map((pathname) => (prevState) => ({
      ...prevState,
      filterType: pathname.replace("/", "") || FilterType.All,
    })),
    todoListSinks.state,
    actions.toggleAll$.map((checked) => (prevState) => ({
      ...prevState,
      allTodoList: prevState.allTodoList.map((todo) => ({
        ...todo,
        isCompleted: !checked,
      })),
    })),
    actions.inputText$.map((text) => (prevState) => ({
      ...prevState,
      text,
    })),
    actions.clearText$.map(() => (prevState) => ({
      ...prevState,
      text: "",
    })),
    actions.addTodo$.map((title) => (prevState) => ({
      ...prevState,
      text: "",
      allTodoList: [
        ...prevState.allTodoList,
        {
          isCompleted: false,
          isEditing: false,
          editingTitle: "",
          title,
        },
      ],
    })),
    actions.clearCompleted$.mapTo((prevState) => ({
      ...prevState,
      allTodoList: prevState.allTodoList.filter((todo) => !todo.isCompleted),
    }))
  ) as Stream<Reducer<AppState>>;
}

function renderFilterButton(props: {
  href: string;
  isSelected: boolean;
  label: string;
}) {
  return li(
    a(
      {
        props: { href: props.href },
        class: {
          selected: props.isSelected,
        },
      },
      props.label
    )
  );
}

function view(
  state$: MemoryStream<
    AppState & {
      activeAmount: number;
      completedAmount: number;
    }
  >
) {
  return state$.map(
    ({ filterType, text, allTodoList, activeAmount, completedAmount }) => {
      const todoList =
        FilterFnMap.get(filterType)?.(allTodoList) || allTodoList;

      return section(".todoapp", [
        header(".header", [
          h1("todos"),
          input(".new-todo", {
            props: {
              type: "text",
              placeholder: "What needs to be done?",
              autofocus: true,
              value: text,
            },
          }),
        ]),
        todoList.length > 0
          ? /* <!-- This section should be hidden by default and shown when there are todos --> */
            section(".main", [
              input(".toggle-all", {
                props: {
                  type: "checkbox",
                  checked: allTodoList.length === completedAmount,
                },
              }),
              label(
                {
                  props: {
                    for: "toggle-all",
                  },
                },
                "Mark all as complete"
              ),
              /* <!-- These are here just to show the structure of the list items --> */
              /* <!-- List items should get the class `editing` when editing and `completed` when marked as completed --> */
              ul(
                ".todo-list",
                todoList.map((todo) => (todo as any).DOM)
              ),
            ])
          : null,
        /* <!-- This footer should be hidden by default and shown when there are todos --> */
        footer(".footer", [
          /* <!-- This should be `0 items left` by default --> */
          span(
            ".todo-count",
            `${activeAmount} item${activeAmount !== 1 ? "s" : ""} left`
          ),
          /* <!-- Remove this if you don't implement routing --> */
          ul(".filters", [
            renderFilterButton({
              href: "#/",
              label: "All",
              isSelected: filterType === FilterType.All,
            }),
            renderFilterButton({
              href: "#/active",
              label: "Active",
              isSelected: filterType === FilterType.Active,
            }),
            renderFilterButton({
              href: "#/completed",
              label: "Completed",
              isSelected: filterType === FilterType.Completed,
            }),
          ]),
          /* <!-- Hidden if no completed items are left ↓ --> */
          button(".clear-completed", `Clear completed (${completedAmount})`),
        ]),
      ]);
    }
  );
}

export function App(sources: AppSources): AppSinks {
  const initialTodoListFromStorage$ = sources.storage.local
    .getItem(StorageKey)
    .map((todoListStr: string) =>
      ((safeJSONParse(todoListStr, []) as TodoProps[]) ?? []).map((todo) => ({
        ...todo,
        editingTitle: "",
        isEditing: false,
      }))
    )
    .take(1);

  const TodoList = makeCollection({
    item: Todo,
    itemKey: (_childState, index) => String(index),
    itemScope: (key) => key,
    collectSinks: (instances) => {
      return {
        state: instances.pickMerge("state"),
        DOM: instances.pickCombine("DOM"),
      };
    },
  });

  const actions = intent(sources.DOM, sources.history);
  const state$ = model(sources.state.stream);

  const todoListSinks = isolate(
    TodoList,
    "allTodoList"
  )(sources) as TodoListSinks;

  const amendedState$ = xs
    .combine(state$, todoListSinks.DOM)
    .map(([state, todoVNodes]) => ({
      ...state,
      allTodoList: state.allTodoList.map((todo, index) => ({
        ...todo,
        DOM: todoVNodes[index],
      })),
    }));

  const vdom$ = view(amendedState$);
  const reducer$ = makeReducer$(
    actions,
    todoListSinks,
    initialTodoListFromStorage$
  );

  const storageRequest$ = amendedState$.compose(debounce(100)).map((state) => ({
    key: StorageKey,
    value: safeJSONStringify(
      state.allTodoList.map(({ title, isCompleted }) => ({
        title,
        isCompleted,
      })),
      ""
    ),
  }));

  const sinks = {
    DOM: vdom$,
    state: reducer$,
    history: actions.changeFilterType$,
    storage: storageRequest$,
  };

  return sinks;
}

export default App;
