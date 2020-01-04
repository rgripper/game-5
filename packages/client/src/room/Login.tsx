import React, { useState } from "react";
import { css } from "emotion";
import { units, colors } from "../styles";
import { Field } from "../shared/Field";
import gql from "graphql-tag";
import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";
import ApolloClient from "apollo-boost";

const container = css`
  height: 100%;
  display: flex;
  align-items: center;
`;

const LOGIN_QUERY = gql`
  query join($name: String!) {
    join(args: { name: $name }) {
      playerId
    }
  }
`;

function Login() {
  const [serverUrl, setServerUrl] = useState("http://localhost:3434");
  const [name, setName] = useState("OrangeGore");

  const [login, { loading, error }] = useMutation(LOGIN_QUERY, {
    client: new ApolloClient({
      uri: serverUrl
    })
  });

  return (
    <div className={container}>
      <form
        onSubmitCapture={async event => {
          event.preventDefault();
          const result = await login({ variables: { name } });
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
