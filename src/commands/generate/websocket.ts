import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface WebSocketOptions {
  path: string;
}

export async function generateWebSocket(
  name: string,
  options: WebSocketOptions
) {
  try {
    logger.info(`Generating WebSocket gateway: ${name}`, { options });

    const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Gateway`;
    const fileName = `${name.toLowerCase()}.gateway.ts`;
    const filePath = join(options.path, fileName);

    const wsContent = `import { Injectable, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from "@ignite/core";
import { Socket, Server } from "socket.io";
import { logger } from "@ignite/core";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ${className} implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private server: Server;

  afterInit(server: Server) {
    this.server = server;
    logger.info("${className} initialized");
  }

  handleConnection(client: Socket, ...args: any[]) {
    logger.info("Client connected", { clientId: client.id });
    
    // TODO: Handle client connection
    this.onClientConnect(client);
  }

  handleDisconnect(client: Socket) {
    logger.info("Client disconnected", { clientId: client.id });
    
    // TODO: Handle client disconnection
    this.onClientDisconnect(client);
  }

  /**
   * Handle ${name} events
   */
  @SubscribeMessage("${name.toLowerCase()}")
  handle${
    name.charAt(0).toUpperCase() + name.slice(1)
  }(client: Socket, data: any): any {
    try {
      logger.debug("Received ${name} message", { clientId: client.id, data });
      
      // TODO: Process the message
      const response = this.processMessage(client, data);
      
      // Send response back to client
      client.emit("${name.toLowerCase()}.response", response);
      
      return response;
    } catch (error) {
      logger.error("Error handling ${name} message", { clientId: client.id, error });
      client.emit("${name.toLowerCase()}.error", { message: "Failed to process message" });
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
    logger.debug("Broadcasted message", { event, data });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any): void {
    this.server.to(clientId).emit(event, data);
    logger.debug("Sent message to client", { clientId, event, data });
  }

  /**
   * Join client to room
   */
  joinRoom(client: Socket, room: string): void {
    client.join(room);
    logger.debug("Client joined room", { clientId: client.id, room });
  }

  /**
   * Remove client from room
   */
  leaveRoom(client: Socket, room: string): void {
    client.leave(room);
    logger.debug("Client left room", { clientId: client.id, room });
  }

  /**
   * Send message to room
   */
  sendToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
    logger.debug("Sent message to room", { room, event, data });
  }

  private onClientConnect(client: Socket): void {
    // TODO: Implement connection logic
    client.emit("welcome", { message: "Connected to ${className}" });
  }

  private onClientDisconnect(client: Socket): void {
    // TODO: Implement disconnection logic
    logger.info(\`Client \${client.id} disconnected from ${className}\`);
  }

  private processMessage(client: Socket, data: any): any {
    // TODO: Implement message processing logic
    return {
      success: true,
      message: "Message processed successfully",
      data: data,
      timestamp: new Date().toISOString()
    };
  }
}

export const ${name.toLowerCase()}Gateway = new ${className}();
`;

    await writeFileIfAbsent(filePath, wsContent);
    logger.info(`WebSocket gateway created: ${filePath}`);
    logger.info(`WebSocket gateway ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate WebSocket gateway: ${name}`, { error });
    process.exit(1);
  }
}
