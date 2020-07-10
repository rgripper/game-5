import React, { useState } from "react";
import GameView from "./game/GameView";
import { Switch, Route, Router, Redirect } from "react-router";
import { createBrowserHistory } from "history";
import Login from "./room/Login";
import Room from "./room/Room";
import { ApolloProvider } from "@apollo/react-hooks";
import ApolloClient from "apollo-client";
import { AppContext } from "./AppContext";

const history = createBrowserHistory();

// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:5000/graphql`,
//   options: {
//     reconnect: true
//   }
// });

function App() {
  const [clientAndUserId, setClientAndUserId] = useState<{
    client: ApolloClient<any>;
    userId: string;
  } | null>(null);
  if (!clientAndUserId) {
    return (
      <Login
        onSuccess={({ options, userId }) =>
          setClientAndUserId({ client: new ApolloClient(options), userId })
        }
      />
    );
  }

  return (
    <ApolloProvider client={clientAndUserId.client}>
      <AppContext.Provider value={{ userId: clientAndUserId.userId }}>
        <Router history={history}>
          <Switch>
            <Route path="/game" component={GameView} />
            <Route path="/room" component={Room} />
            <Redirect to="/room" />
          </Switch>
        </Router>
      </AppContext.Provider>
    </ApolloProvider>
  );
}

export default App;
