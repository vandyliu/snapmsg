import styled from 'styled-components';

const MsgSelf = styled.div`
    display: flex;
    max-width: 100%;
    flex-direction: column;
    position: relative;
    word-wrap: break-word;
    align-self: flex-end;
    align-items: flex-end;
`
 
const MsgThem = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    word-wrap: break-word;
    align-items: flex-start;
`

const MessageBubbleSelf = styled.div`
    display: flex;
    border-radius: 1.15rem;
    line-height: 0;
    max-width: 100%;
    padding: 0.5rem .875rem;
    position: relative;
    word-wrap: break-word;
    align-self: flex-end;
    align-items: flex-end;
    background-color: #0084ff;
    color: #e4fbff;
    margin: 0 0.4rem 0.1rem;
    font-weight: 450;
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
    line-height: 0;
    max-width: 75%;
    padding: 0.5rem 0.875rem;
    position: relative;
    word-wrap: break-word;
    align-items: flex-start;
    background-color: #2a2a2a;
    color: #c9cbce;
    margin: 0 0.4rem 0.1rem;
    font-weight: 450;
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

const Container = styled.div`
    min-height: 20em;
    max-height: 20em;
    overflow-y: scroll;
    padding: 1em 0;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
`

const Timestamp = styled.p`
color: #666;
font-size: 10px;
margin-bottom: 3px;
margin-left: 1em;
margin-right: 1em;
`

const NoMessages = styled.h3`
font-size: 2em;
padding-bottom: 2px;
margin-bottom: 2px;
align-items: center;
text-align: center;
`

const isEmptyObject = (obj) => {
    return (obj && Object.keys(obj).length === 0
    && Object.getPrototypeOf(obj) === Object.prototype);
}

export const MessageList = (messages: any[]) => {
    if (!messages){
        return <Container><NoMessages>{"No messages"}</NoMessages></Container>;
    }
    const innerMessages = (messages as any).messages;
    if (innerMessages.length > 0) console.log('0th message', innerMessages[0]);
    console.info('innerMessages info', innerMessages);
    if (innerMessages.length === 0) {
        return <Container><NoMessages>{"No messages"}</NoMessages></Container>;
    }
    const filteredInnerMessages = innerMessages.filter((msg) => {return !isEmptyObject(msg)});
    console.log('filteredinner', filteredInnerMessages);
    return <Container> 
        {filteredInnerMessages.map(msg => {
            return msg.isSender ?
            <MsgSelf><Timestamp>{new Date(msg.timestamp).toLocaleString() }</Timestamp><MessageBubbleSelf><p>{msg.message}</p></MessageBubbleSelf></MsgSelf> :
            <MsgThem><Timestamp>{new Date(msg.timestamp).toLocaleString() }</Timestamp><MessageBubbleThem><p>{msg.message}</p></MessageBubbleThem></MsgThem>})
        }
    </Container>;
}

export default MessageList;