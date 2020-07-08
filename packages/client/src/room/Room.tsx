import React, { useState } from "react";
import { css } from "emotion";
import gql from "graphql-tag";
import { units, colors } from "../styles";
import { useMutation, useSubscription, useQuery } from "@apollo/react-hooks";

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

const PLAYERS_SUB = gql`
  subscription onPlayers {
    players {
      id
      name
      isReady
    }
  }
`;

const PLAYERS_QUERY = gql`
  query players {
    players {
      id
      name
      isReady
    }
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

type Player = {
  id: string;
  name: string;
  isReady: boolean;
};

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
  const [hasInitData, setHasInitData] = useState<boolean>();
  const initQuery = useQuery(PLAYERS_QUERY, { skip: hasInitData });
  const subQuery = useSubscription(PLAYERS_SUB);
  const players: Player[] | undefined =
    subQuery.data?.players ?? initQuery.data?.players;

  const currentPlayerId = "222";

  const isReady = false;
  return (
    (players && (
      <div className={container}>
        <div className={playerList}>
          {players.map((x) => (
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
    )) ??
    null
  );
}

export default Room;
