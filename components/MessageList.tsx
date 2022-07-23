import { Message } from "./Message";

export const MessageList = (messages: any, receiver: string) => {
    if (!messages || !messages[receiver]) return <p>{"No messages"}</p>;
    return messages[receiver].map(msg => {
        return <Message message={msg.message} timestamp={msg.timestamp} isSender={msg.isSender}/>;
    })
}