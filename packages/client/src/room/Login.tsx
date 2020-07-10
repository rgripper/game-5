import React, { useState } from "react";
import { css } from "emotion";
import { Field } from "../shared/Field";
import gql from "graphql-tag";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient, ApolloClientOptions } from "apollo-client";
import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { useMutation } from "@apollo/react-hooks";
import { getMainDefinition } from "apollo-utilities";

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

function createLink(httpUrl: string, wsUrl: string, authToken: string) {
  const httpLink = new HttpLink({
    uri: httpUrl,
    headers: {
      authorization: authToken,
    },
  });

  //Create a WebSocket link:
  const wsLink = new WebSocketLink({
    uri: wsUrl,
    options: {
      connectionParams: {
        authToken,
      },
      reconnect: true,
    },
  });

  // using the ability to split links, you can send data to each link
  // depending on what kind of operation is being sent
  return split(
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
}

type LoginSuccessResult = { options: ApolloClientOptions<any>; userId: string };

function Login(props: { onSuccess(params: LoginSuccessResult): void }) {
  const [serverUrl, setServerUrl] = useState("http://localhost:5000");
  const [name, setName] = useState("OrangeGore");

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    client: new ApolloClient({
      link: new HttpLink({
        uri: serverUrl,
      }),
      cache: new InMemoryCache({}),
    }),
  });

  return (
    <div className={container}>
      <form
        onSubmitCapture={async (event) => {
          event.preventDefault();
          const result = await login({ variables: { name } });
          const userId = result.data.login;
          const token = userId;
          const apolloClientOptions = {
            cache: new InMemoryCache({}),
            //headers: { authorization: token },
            link: createLink(
              "http://localhost:5000",
              "ws://localhost:5000/graphql",
              token
            ),
          };
          props.onSuccess({ options: apolloClientOptions, userId });
        }}
      >
        <fieldset disabled={loading}>
          <Field
            value={serverUrl}
            onChange={(e) => setServerUrl(e.currentTarget.value)}
          >
            Server
          </Field>
          <Field value={name} onChange={(e) => setName(e.currentTarget.value)}>
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
