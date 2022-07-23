import { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import snapCfg from '../snap.config';
import snapManifest from '../snap.manifest.json';
import { JsonRpcError } from 'json-rpc-engine';
import {PrivyClient, SiweSession} from '@privy-io/privy-browser';
import { EthereumProvider } from '@privy-io/privy-browser/dist/sessions/siwe';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1em;
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

const Home: NextPage = () => {
  const [snapId, setSnapId] = useState('');
  const [text, setText] = useState('');
  const [receiver, setReceiver] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  // run only client-side
  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setSnapId(
        `local:${window.location.protocol}//${window.location.hostname}:${snapCfg.cliOptions.port}`,
      );
    } else {
      setSnapId(`npm:${snapManifest.source.location.npm.packageName}`);
    }
  }, []);

  const connect = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_enable',
      params: [
        {
          wallet_snap: { [snapId]: {} },
        },
      ],
    });
    console.log('response to connect');
    console.log(JSON.stringify(response));
    if (response && (response as any).accounts && (response as any).accounts.length > 0) {
      setCurrentUser((response as any).accounts[0])
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


  const updateMessages = async (client: PrivyClient, user: string, otherUser: string, message: string, isSender: boolean) => {
    const rawMessages = await client.get(user, 'inbox')
    let messages;
    try {
      messages = JSON.parse(rawMessages?.text() as string);
    } catch(e) {
      messages = {};
    }
    console.log('messages from get', rawMessages);
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
        const PRIVY_API_KEY = 'dqubqwb2qQQqDemJ_RnkInt-HdBpv17T-3-v763ZYQA=';
        const session = new SiweSession(PRIVY_API_KEY, window.ethereum as unknown as EthereumProvider);
        const client = new PrivyClient({session: session});
        updateMessages(client, currentUser, receiver, message, true);
        if (currentUser !== receiver) {
          updateMessages(client, receiver, currentUser, message, false);
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

      <Button onClick={() => connect()}>
        Connect
      </Button>
      <Button onClick={() => sendHello()}>
        Send Hello
      </Button>
      <input value={text} onChange={(e) => {setText(e.target.value)}}></input>
      <label htmlFor={"receiverInput"}>Receiver</label>
      <input id={"receiverInput"} value={receiver} onChange={(e) => {setReceiver(e.target.value)}}></input>
      <Button disabled={!text || !receiver} onClick={() => sendMsg(receiver, text)}>Send Msg</Button>
    </Container>
  );
};

export default Home;
