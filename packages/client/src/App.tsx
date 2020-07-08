import React, { useState } from "react";
import GameView from "./game/GameView";
import { Switch, Route, Router, Redirect } from "react-router";
import { createBrowserHistory } from "history";
import Login from "./room/Login";
import Room from "./room/Room";
import { WebSocketLink } from "apollo-link-ws";
import { ApolloProvider } from "@apollo/react-hooks";
import ApolloClient from "apollo-client";

const history = createBrowserHistory();

// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:5000/graphql`,
//   options: {
//     reconnect: true
//   }
// });

function App() {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  if (!client) {
    return (
      <Login
        onClientOptions={(options) => setClient(new ApolloClient(options))}
      />
    );
  }

  return (
    <ApolloProvider client={client}>
      <Router history={history}>
        <Switch>
          <Route path="/game" component={GameView} />
          <Route path="/room" component={Room} />
          <Redirect to="/room" />
        </Switch>
      </Router>
    </ApolloProvider>
  );
}

export default App;
