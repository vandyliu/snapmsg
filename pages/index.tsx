import { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import snapCfg from '../snap.config';
import snapManifest from '../snap.manifest.json';
import { JsonRpcError } from 'json-rpc-engine';
import {PrivyClient, SiweSession} from '@privy-io/privy-browser';
import { EthereumProvider } from '@privy-io/privy-browser/dist/sessions/siwe';
import { MessageList } from '../components/MessageList';

const MessageBox = styled.div`
  display: flex;
  flex-direction: column;
`

const SendButtonText = styled.span`
position: relative;
top: -3px;
left: -1px;
`

const CameraButtonText = styled.span`
top: -8px;
left: -10px;
position: relative;
`

const MessageInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 1em;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1em;
`

const Label = styled.h4`
  font-size: 1em;
  padding-bottom: 2px;
  margin-bottom: 2px;
`

const ReceiverInput = styled.input`
  font-size: 1em;
  padding: 7px 9px;
  border-radius: 4px;
  border: 2px solid #666;
  margin-bottom: 0.5em;
  width: 25em;
`

const MessageInput = styled.input`
font-size: 1em;
padding: 7px 9px;
border-radius: 4px;
border: 2px solid #666;
margin-bottom: 0.5em;
width: 100%;
height: 3em;
box-sizing: border-box;
border-radius: 4px;
text-color: #d2d2d2;
background-color: #212121;
resize: none;
`

const Button = styled.button`
  margin-top: 0.5em;
  border: none;
  border-radius: 6px;
  padding: 0.6em 1em;
  width: 80px;
  text-align: center;
  font-weight: 500;
  :hover {
    cursor: pointer;
  }
  :focus {
    box-shadow: 0px 2px 2px -1px rgba(0, 0, 0, 0.12), 0px 0px 0px 3px #9a3fcf;
    outline: none;
  }
  :disabled {
    opacity: 85%;
    cursor: inherit;
  }
`

const SendButton = styled(Button)`
font-size: 24px;
font-color: white;
margin-top: 0;
height: 2em;
width: 60px;
margin-left: 10px;
`

const PRIVY_API_KEY = process.env.REACT_APP_PRIVY_API_KEY || '2Nw-liP1OAAzl7757r1s-tWAMLqq4RUq2H-vIGhAN6o=';

const Home: NextPage = () => {
  const [snapId, setSnapId] = useState('');
  const [text, setText] = useState('');
  const [receiver, setReceiver] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [messages, setMessages] = useState({} as any);
  const [client, setClient] = useState(null as PrivyClient | null);
  const [receiverMessages, setReceiverMessages] = useState([]);

  // run only client-side
  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setSnapId(
        `local:${window.location.protocol}//${window.location.hostname}:${snapCfg.cliOptions.port}`,
      );
    } else {
      setSnapId(`npm:${snapManifest.source.location.npm.packageName}`);
    }
    if (document.readyState === "complete") {
      console.log('current user', currentUser);
      console.log("redoing privy client");
      const session = new SiweSession(PRIVY_API_KEY, window.ethereum as unknown as EthereumProvider);
      console.log(PRIVY_API_KEY);
      const client = new PrivyClient({session: session});
      setClient(client);
    }
  }, [currentUser]);


  
  useEffect(() => {
    const getMessagesInner = async () => {
      console.log("GET MESSAGES USE EFFECT HAPPENING");
      const messages = await getMessages(currentUser);
      setMessages(messages);
    }

    getMessagesInner().then(() => {
      console.log('getmessagesinner', messages);
      if (receiver && receiver in messages && validateInputAddresses(receiver)) {
        console.log("setting receiver msgs");
        setReceiverMessages(messages[receiver]);
      } else if (receiverMessages.length !== 0) {
        console.log("setting receiver msgs to nothing")
        setReceiverMessages([]);
      }
      console.log("new receiver messages", receiverMessages);
    }).catch(console.error);
  }, [currentUser, receiver, messages])

  const validateInputAddresses = (address: string) => {
    return (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address));
  }

  const connect = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_enable',
      params: [
        {
          wallet_snap: { [snapId]: {} },
        },
      ],
    });
    console.log(JSON.stringify(response));
    if (response && (response as any).accounts && (response as any).accounts.length > 0) {
      setCurrentUser((response as any).accounts[0].toLowerCase());
    }
  };
  const sendHello = async () => {
    try {
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'hello',
          },
        ],
      });
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + (err as JsonRpcError).message || err);
    }
  };

  const checkClient = () => {
    if (!client) {
      console.error("PrivyClient not ready");
      return false;
    }
    console.log("PrivyClient is ready");
    return true;
  }

  const getMessages = async (user: string) => {
    if (!checkClient()) return;
    checkConnected();

    const rawMessages = await client.get(user, 'inbox')
    let messages;
    try {
      messages = JSON.parse(rawMessages?.text() as string);
    } catch(e) {
      messages = {};
    }
    return messages;
  }

  const checkConnected = () => {
    if (!currentUser) {
      console.error("Connect first");
      throw Error("Connect first");
    }
  }

  const updateMessages = async (user: string, otherUser: string, message: string, isSender: boolean) => {
    const messages = await getMessages(user);
    const receiverMessages = (messages as any)[otherUser] ?? [];
    messages[otherUser] = receiverMessages;
    messages[otherUser].push({
      id: messages[otherUser].length,
      timestamp: new Date(),
      message: message,
      isSender
    })
    console.log(`${otherUser} messages`, JSON.stringify(receiverMessages));

    const result = await client.put(user, [
      {field: "inbox", value: JSON.stringify(messages)}]);
  }

  const sendMsg = async (receiver: string, message: string) => {
    try {
      // sign message with metamask
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'sendmsg',
            params: {
              receiver,
              message
            }
          },
        ],
      });
      if (response) {
        console.log('success', 'current user', currentUser)
        setText('');

        // if approved then send message via privy
        updateMessages(currentUser, receiver, message, true);
        if (currentUser !== receiver) {
          updateMessages(receiver, currentUser, message, false);
        }
      } else {
        console.log("reject but good")
      }
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + (err as JsonRpcError).message || err);
    }
  };

  return (
    <Container>
      <h1>SnapMsg 📨</h1>
      <details>
        <summary>Instructions</summary>
        <ul>
          {/* eslint-disable-next-line react/no-unescaped-entities*/}
          <li>Install the Snap with the Connect button</li>
          <li>Please note that:</li>
          <ul>
            <li>
              Receiver must be a valid 42 character wallet address.
            </li>
          </ul>
        </ul>
      </details>
      { currentUser ? <>
      <Label htmlFor={"receiverInput"}>Receiver</Label>
      <ReceiverInput placeholder={'0x'} id={"receiverInput"} value={receiver} onChange={(e) => {setReceiver(e.target.value.toLowerCase())}} />
      <MessageBox>
      <MessageList messages={receiverMessages} />
      <MessageInputContainer>
        <MessageInput value={text} onChange={(e) => {setText(e.target.value)}} />
        <SendButton><CameraButtonText>📷</CameraButtonText></SendButton>
        <SendButton disabled={!text || !validateInputAddresses(receiver)} onClick={() => sendMsg(receiver, text)}><SendButtonText>></SendButtonText></SendButton>
      </MessageInputContainer>
      </MessageBox>
      </> : 
      <>
        <p>Please connect first</p>
        <Button onClick={() => connect()}>
          Connect
        </Button></> }
    </Container>
  );
};

export default Home;
