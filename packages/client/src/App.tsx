import React from "react";
import GameView from "./game/GameView";
import { Switch, Route } from "react-router-dom";
import Login from "./room/Login";
function App() {
  const isAuthenticated = false;
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/game" component={GameView} />
    </Switch>
  );
}

export default App;
