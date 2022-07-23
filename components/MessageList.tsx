import styled from 'styled-components';

const MessageBubbleSelf = styled.div`
    display: flex;
    border-radius: 1.15rem;
    line-height: 1.25;
    max-width: 75%;
    padding: 0.5rem .875rem;
    position: relative;
    word-wrap: break-word;
    align-self: flex-end;
    background-color: #2561ED;
    color: #fff;
    margin: 0.25rem 0 0;
    width: fit-content;
    &:before {
        border-bottom-left-radius: 0.8rem 0.7rem;
        border-right: 1rem solid #248bf5;
        right: -0.35rem;
        transform: translate(0, -0.1rem);
    }
    &:after {
        background-color: #fff;
        border-bottom-left-radius: 0.5rem;
        right: -40px;
        transform:translate(-30px, -2px);
        width: 10px;
    }
`
 
const MessageBubbleThem = styled.div`
    display: flex;
    border-radius: 1.15rem;
    line-height: 1.25;
    max-width: 75%;
    padding: 0.5rem .875rem;
    position: relative;
    word-wrap: break-word;
    align-items: flex-start;
    background-color: #e5e5ea;
    color: #000;
    margin: 0.25rem 0 0;
    width: fit-content;
    &:before {
        border-bottom-right-radius: 0.8rem 0.7rem;
        border-left: 1rem solid #e5e5ea;
        left: -0.35rem;
        transform: translate(0, -0.1rem);
    }
    &:after {
        background-color: #fff;
        border-bottom-right-radius: 0.5rem;
        left: 20px;
        transform: translate(-30px, -2px);
        width: 10px;
    }
`

const isEmptyObject = (obj) => {
    return (obj && Object.keys(obj).length === 0
    && Object.getPrototypeOf(obj) === Object.prototype);
}

export const MessageList = (messages: any[]) => {
    if (!messages){
        return <p>{"No messages"}</p>;
    }
    const innerMessages = (messages as any).messages;
    if (innerMessages.length > 0) console.log('0th message', innerMessages[0]);
    console.info('innerMessages info', innerMessages);
    if (innerMessages.length === 0) {
        return <p>{"No messages"}</p>
    }
    const filteredInnerMessages = innerMessages.filter((msg) => {return !isEmptyObject(msg)});
    console.log('filteredinner', filteredInnerMessages);
    return <> 
        {filteredInnerMessages.map(msg => {
            return msg.isSender ?
            <MessageBubbleSelf><p>{msg.message}</p></MessageBubbleSelf> :
            <MessageBubbleThem><p>{msg.message}</p></MessageBubbleThem>})
        }
    </>;
}

export default MessageList;