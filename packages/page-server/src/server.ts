import { createServerOnChannel } from "./channel-server";

const peerConnection = new RTCPeerConnection({ 
    iceServers: [{
        urls: 'stun:stun1.l.google.com:19302', 
        username: "spooky",
        credential: "mulder"
    }] 
});
const channel = peerConnection.createDataChannel('sim', { ordered: true });

channel.onopen = () => {
    alert('open!');
    createServerOnChannel({ channel, onStart: () => console.log('Server received a start command') });
}
