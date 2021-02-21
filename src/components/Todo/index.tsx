import xs from "xstream";
import type { Stream } from "xstream";
import {
  button,
  div,
  input,
  label,
  li,
  MainDOMSource,
  VNode,
} from "@cycle/dom";
import type { Reducer, StateSource } from "@cycle/state";

export interface TodoProps {
  isCompleted: boolean;
  isEditing: boolean;
  title: string;
  editingTitle: string;
}

export interface TodoSources {
  DOM: MainDOMSource;
  state: StateSource<TodoProps>;
}

export interface TodoSinks {
  DOM: Stream<VNode>;
  state: Stream<Reducer<TodoProps>>;
}

function intent(domSource: MainDOMSource) {
  return {
    toggle$: domSource
      .select(".toggle")
      .events("change")
      .map((ev) => (ev.target as HTMLInputElement).checked),
    enterEditing$: domSource
      .select("label")
      .events("dblclick")
      .mapTo(undefined),
    editing$: domSource
      .select(".edit")
      .events("input")
      .map((ev) => (ev.target as HTMLInputElement).value.trim()),
    completeEditing$: domSource
      .select(".edit")
      .events("keydown")
      .filter((ev) => ev.key === "Enter")
      .compose((s) => xs.merge(s, domSource.select(".edit").events("blur"))),
    cancelEditing$: domSource
      .select(".edit")
      .events("keydown")
      .filter((ev) => ev.key === "Escape")
      .mapTo(undefined),
    delete$: domSource.select(".destroy").events("click").mapTo(undefined),
  };
}

function makeReducer$(actions: ReturnType<typeof intent>) {
  return xs.merge(
    xs.of((prevState: TodoProps) => {
      if (typeof prevState === "undefined") {
        return {
          isCompleted: false,
          isEditing: false,
          title: "",
          editingTitle: "",
        };
      } else {
        return prevState;
      }
    }),
    actions.toggle$.map((checked) => (prevState: TodoProps) => ({
      ...prevState,
      isCompleted: checked,
    })),
    actions.enterEditing$.mapTo((prevState: TodoProps) => ({
      ...prevState,
      editingTitle: prevState.title,
      isEditing: true,
    })),
    actions.editing$.map((title) => {
      return (prevState: TodoProps) => ({
        ...prevState,
        editingTitle: title,
      });
    }),
    actions.cancelEditing$.mapTo((prevState: TodoProps) => ({
      ...prevState,
      editingTitle: "",
      isEditing: false,
    })),
    actions.completeEditing$.mapTo((prevState: TodoProps) => ({
      ...prevState,
      isEditing: false,
      title: prevState.isEditing ? prevState.editingTitle : prevState.title,
      editingTitle: "",
    })),
    actions.delete$.mapTo(() => undefined)
  );
}

function view(state$: Stream<TodoProps>) {
  return state$.map((props: TodoProps) => {
    return li(
      {
        class: {
          completed: props.isCompleted,
          editing: props.isEditing,
        },
      },
      [
        div(".view", [
          input(".toggle", {
            props: {
              type: "checkbox",
              checked: props.isCompleted,
            },
          }),
          label(props.title),
          button(".destroy"),
        ]),
        input(".edit", {
          props: {
            type: "text",
            value: props.editingTitle,
          },
          hook: {
            update: (_: any, { elm }: { elm: HTMLInputElement }) => {
              if (props.isEditing) {
                elm.focus();
                elm.selectionStart = elm.value.length;
              }
            },
          },
        }),
      ]
    );
  });
}

export function Todo(sources: TodoSources): TodoSinks {
  const state$ = sources.state.stream;

  const actions = intent(sources.DOM);
  const reducer$ = makeReducer$(actions);

  const sinks = {
    DOM: view(state$),
    state: reducer$,
  };

  return sinks;
}
