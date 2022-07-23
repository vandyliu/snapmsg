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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1em;
`

const ReceiverInput = styled.input`
  height: 10em;
`

const Button = styled.button`
  margin-top: 0.5em;
  border: none;
  border-radius: 6px;
  padding: 0.6em 2em;
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

const PRIVY_API_KEY = process.env.REACT_APP_PRIVY_API_KEY || '0';

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
      <h1>Hello, Snaps!</h1>
      <details>
        <summary>Instructions</summary>
        <ul>
          {/* eslint-disable-next-line react/no-unescaped-entities*/}
          <li>First, click "Connect". Then, try out the other Buttons!</li>
          <li>Please note that:</li>
          <ul>
            <li>
              The <code>snap.manifest.json</code> and <code>package.json</code>{' '}
              must be located in the server root directory..
            </li>
            <li>
              The Snap bundle must be hosted at the location specified by the{' '}
              <code>location</code> field of <code>snap.manifest.json</code>.
            </li>
          </ul>
        </ul>
      </details>
      <br />

      { currentUser ? <>
      <label htmlFor={"receiverInput"}>Receiver</label>
      <ReceiverInput id={"receiverInput"} value={receiver} onChange={(e) => {setReceiver(e.target.value.toLowerCase())}} />
      <MessageList messages={receiverMessages} />
      <input value={text} onChange={(e) => {setText(e.target.value)}}></input>
      <Button disabled={!text || !receiver} onClick={() => sendMsg(receiver, text)}>Send Msg</Button>
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
