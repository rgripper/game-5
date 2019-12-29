import React, { useState } from "react";
function Input({
  children,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      <div>{children}</div>
      <input {...inputProps} />
    </label>
  );
}

function Login() {
  const [serverUrl, setServerUrl] = useState("http://localhost:3434");
  const [name, setName] = useState("OrangeGore");

  return (
    <form
      onSubmitCapture={event => {
        event.preventDefault();
      }}
    >
      <Input
        value={serverUrl}
        onChange={e => setServerUrl(e.currentTarget.value)}
      >
        Server
      </Input>
      <Input value={name} onChange={e => setName(e.currentTarget.value)}>
        Name
      </Input>
      <div>
        <button>Join</button>
      </div>
    </form>
  );
}

export default Login;
