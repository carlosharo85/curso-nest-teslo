import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { MessageWsService } from './message-ws.service';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtPayload } from 'src/auth/interfaces';


@WebSocketGateway({ cors: true })
export class MessageWsGateway implements OnGatewayConnection, OnGatewayDisconnect {


    @WebSocketServer() wss: Server;
    constructor(
        private readonly messageWsService: MessageWsService,
        private readonly jwtService: JwtService
    ) {}


    async handleConnection(client: Socket) {
        const token = client.handshake.headers.authentication as string;
        let payload: JwtPayload;

        try {
            payload = this.jwtService.verify(token);
            await this.messageWsService.registerClient(client, payload.id);
        } catch(error) {
            client.disconnect();
            return;
        }

        this.wss.emit('clients-updated', this.messageWsService.getConnectedClients());
    }


    handleDisconnect(client: Socket) {
        this.messageWsService.removeClient(client.id)
        this.wss.emit('clients-updated', this.messageWsService.getConnectedClients());
    }


    @SubscribeMessage('message-from-client')
    handleMessageFromClient(client: Socket, payload: NewMessageDto) {
        //emite al cliente
        /*client.emit('message-from-server', {
            fullName: 'Soy Yo!',
            message: payload.message || 'no-message!!'
        });*/

        //emite a todos menos al cliente
        /*client.broadcast.emit('message-from-server', {
            fullName: 'Soy Yo!',
            message: payload.message || 'no-message!!'
        });*/

        //mandar un mensaje a todos los clientes
        this.wss.emit('message-from-server', {
            fullName: this.messageWsService.getUserFullName(client.id),
            message: payload.message || 'no-message!!'
        });
    }
}
