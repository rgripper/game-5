import React, { useState } from "react";
import GameView from "./game/GameView";
import { Switch, Route, Router, Redirect } from "react-router";
import { createBrowserHistory } from "history";
import Login from "./room/Login";
import { ApolloProvider, ApolloClient } from "@apollo/client";

const history = createBrowserHistory();

function App() {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  if (!client) {
    return (
      <Login
        onClientOptions={options => setClient(new ApolloClient(options))}
      />
    );
  }

  return (
    <ApolloProvider client={client}>
      <Router history={history}>
        <Switch>
          <Route path="/game" component={GameView} />
          <Redirect to="/game" />
        </Switch>
      </Router>
    </ApolloProvider>
  );
}

export default App;
