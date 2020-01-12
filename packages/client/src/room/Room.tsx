import React, { useState } from "react";
import { css } from "emotion";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { units, colors } from "../styles";

const container = css`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  > :first-child {
    margin-bottom: ${units(20)};
  }
`;

const playerList = css`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: ${units(4)};
  grid-column-gap: ${units(4)};
`;

const SET_READY_MUTATION = gql`
  mutation setReady($isReady: Boolean!) {
    setReady(isReady: $isReady)
  }
`;

const playerState = css`
  padding: ${units(4)};
  border: 1px solid ${colors.border};
  flex-grow: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  > * {
    display: inline-block;
  }

  > :first-child {
    margin-right: ${units(4)};
    flex: 1;
  }
`;

const readyIcon = (isReady: boolean) => css`
  width: 0;
  height: 0;
  border-left: ${units(4)} solid transparent;
  border-right: ${units(4)} solid transparent;
  border-bottom: ${units(7)} solid
    ${isReady ? colors.secondary : colors.inactive};
`;

function PlayerState(props: { isReady: boolean; name: string }) {
  return (
    <div className={playerState}>
      <span>{props.name}</span>
      <span className={readyIcon(props.isReady)}></span>
    </div>
  );
}

function Room() {
  const [setReady, { loading, error }] = useMutation(SET_READY_MUTATION);
  const currentPlayerId = "222";
  const players = [
    { isReady: true, name: "SomePlayer1 sdsadasdsa", id: "111" },
    { isReady: true, name: "SomePlayer2", id: "222" },
    { isReady: true, name: "SomePlayer3", id: "333" },
    { isReady: false, name: "SomePlayer4", id: "444" },
    { isReady: true, name: "SomePlayer5", id: "555" }
  ];
  const isReady = false;
  return (
    <div className={container}>
      <div className={playerList}>
        {players.map(x => (
          <PlayerState key={x.id} {...x} />
        ))}
      </div>
      <div>
        <button
          disabled={loading}
          onClick={() => setReady({ variables: { isReady: !isReady } })}
        >
          {isReady ? "Unready" : "Ready"}
        </button>
      </div>
    </div>
  );
}

export default Room;
