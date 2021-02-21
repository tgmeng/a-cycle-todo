import { run } from "@cycle/run";
import { withState } from "@cycle/state";
import { makeDOMDriver } from "@cycle/dom";
import { makeHashHistoryDriver } from "@cycle/history";
import storageDriver from "@cycle/storage";

import { App } from "./App";

const drivers = {
  DOM: makeDOMDriver(document.querySelector("#app")),
  history: makeHashHistoryDriver(),
  storage: storageDriver,
};

const WrappedApp = withState(App);

run(WrappedApp, drivers);
