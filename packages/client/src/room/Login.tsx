import React, { useState } from "react";
import { css } from "emotion";
import { Field } from "../shared/Field";
import gql from "graphql-tag";
import {
  useMutation,
  ApolloClient,
  InMemoryCache,
  ApolloClientOptions,
  NormalizedCacheObject
} from "@apollo/client";

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

function Login(props: {
  onClientOptions: (
    options: ApolloClientOptions<NormalizedCacheObject>
  ) => void;
}) {
  const [serverUrl, setServerUrl] = useState("http://localhost:3434");
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
            uri: serverUrl,
            cache: new InMemoryCache({}),
            headers: { authorization: token }
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
