import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[];
    public queue: string[];
    private roomManager: RoomManager;
    
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {
        this.users.push({
            name, socket
        })
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue()
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        const user = this.users.find(x => x.socket.id === socketId);
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x === socketId);
        if (user) {
            console.log('inside remove user');
            
            this.roomManager.removeRoom(user)
        }
       
    }

    clearQueue() {
        console.log("inside clear queues")
        console.log(this.queue.length);
        if (this.queue.length < 2) {
            return;
        }

        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        console.log("id is " + id1 + " " + id2);
        const user1 = this.users.find(x => x.socket.id === id1);
        const user2 = this.users.find(x => x.socket.id === id2);

        if (!user1 || !user2) {
            return;
        }
        console.log("creating room");

        const room = this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            console.log("inside offer");
            console.log("roomId "+roomId);
            console.log("sdp "+sdp);
            
            this.roomManager.onOffer(roomId, sdp, socket.id);
        })

        socket.on("answer",({sdp, roomId}: {sdp: string, roomId: string}) => {
            console.log("inside answer");
            console.log("roomId "+roomId);
            console.log("sdp "+sdp);
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        })

        socket.on("add-ice-candidate", ({candidate, roomId, type}) => {
            console.log("inside add ice candidate");
            console.log("roomId "+roomId);
            console.log("candidate "+candidate);
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
        socket.on("deleting-room",({roomID}:{roomID:string})=>{
            console.log("inside deleting room");
            console.log("roomID "+roomID);
        })
    }

}
