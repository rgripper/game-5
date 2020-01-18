import React, { useState } from "react";
import { css } from "emotion";
import { Field } from "../shared/Field";
import gql from "graphql-tag";
import {
  useMutation,
  ApolloClient,
  InMemoryCache,
  ApolloClientOptions,
  NormalizedCacheObject,
  getMainDefinition,
  split,
  HttpLink
} from "@apollo/client";
import { WebSocketLink } from "apollo-link-ws";

const container = css`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LOGIN_MUTATION = gql`
  mutation login($name: String!) {
    login(name: $name)
  }
`;

const httpLink = new HttpLink({
  uri: "http://localhost:3000/graphql"
});

//Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: `ws://localhost:5000/`,
  options: {
    reconnect: true
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink as any,
  httpLink
);

function Login(props: {
  onClientOptions: (
    options: ApolloClientOptions<NormalizedCacheObject>
  ) => void;
}) {
  const [serverUrl, setServerUrl] = useState("ws://localhost:5000/graphql"); //"http://localhost:3434");
  const [name, setName] = useState("OrangeGore");

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    client: new ApolloClient({
      uri: serverUrl,
      cache: new InMemoryCache({})
    })
  });

  return (
    <div className={container}>
      <form
        onSubmitCapture={async event => {
          event.preventDefault();
          const result = await login({ variables: { name } });
          const token = result.data.login;
          props.onClientOptions({
            //uri: serverUrl,
            cache: new InMemoryCache({}),
            //headers: { authorization: token },

            link: new WebSocketLink({
              uri: `ws://localhost:5000/graphql`,
              options: {
                reconnect: true,
                connectionParams: {
                  authToken: token
                }
              }
            }) as any
          });
        }}
      >
        <fieldset disabled={loading}>
          <Field
            value={serverUrl}
            onChange={e => setServerUrl(e.currentTarget.value)}
          >
            Server
          </Field>
          <Field value={name} onChange={e => setName(e.currentTarget.value)}>
            Name
          </Field>
          <div>
            <button>Login</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default Login;
