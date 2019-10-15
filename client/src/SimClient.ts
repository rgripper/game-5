import { WorldParams, createClientOnChannel, ChannelClient } from "page-server";

type CreatePipelineParams = {
    worldParams: WorldParams;
}

export async function createPipeline (params: CreatePipelineParams): Promise<ChannelClient> {
    const simWorker = new Worker('./worker.js');

    const peerConnection = new RTCPeerConnection({ 
        iceServers: [{
            urls: 'stun:stun1.l.google.com:19302', 
            username: "spooky",
            credential: "mulder"
        }] 
    });
    const channel = peerConnection.createDataChannel('sim', { ordered: true });

    return createClientOnChannel(channel, params.worldParams, 2000);

    // const postStart = (worldParams: WorldParams) => simWorker.postMessage({ type: 'Start', worldParams } as SimServerEventData, undefined as any);
    // const postCommand = (command: SimCommand) => simWorker.postMessage({ type: 'SimCommand', command } as SimServerEventData, undefined as any);
    // const postFinish = () => simWorker.postMessage({ type: 'Finish' } as SimServerEventData, undefined as any)
    
    

    // const connect = () => {
    //     simWorker.removeEventListener("message", connect);
    //     postStart(params.worldParams);
    //     return {
    //         subscribeInput: (input$: Observable<SimCommand>) => input$.subscribe({ next: postCommand, complete: postFinish }),
    //         output$: Observable.create((o: Observer<Update>) => {
    //             simWorker.onmessage = (event: MessageEvent) => o.next(event.data as Update);
    //             simWorker.onerror = ({ error }: ErrorEvent) => o.error({ error });
    //         })
    //     }
    // }

    // simWorker.addEventListener("message", connect);
}
