import { createServerOnChannel } from "./channel-server";

const peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
      username: "spooky",
      credential: "mulder"
    }
  ]
});

peerConnection.ondatachannel = ({ channel }) => {
  alert("data channel!");
  createServerOnChannel({
    channel,
    onStart: () => console.log("Server received a start command")
  });
};
