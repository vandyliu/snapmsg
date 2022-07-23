import React, { useState, useEffect } from 'react';
import { connect, getExtendedPublicKey, signPsbt } from './lib/snap';
import {
  addressAggrator,
  countUtxo,
  satoshiToBTC,
  btcToSatoshi,
} from './lib/helper';
import { genreatePSBT, getNodeFingerPrint, sendTx } from './lib/index';
import './App.css';
import { PageHeader } from './components/Header';
import { PageFooter } from './components/Footer';
import { Address } from './components/Address';
import SendBox from './components/Send';
import AddressBox from './components/AddressBox';
import Banner from './components/Banner';
import { TransactionList } from './components/TransactionList';
import { useExtendedPubKey } from './hook/useExtendedPubKey';
import { useFeeRate } from './hook/useBitcoinTx';
import { useTransaction } from './hook/useTransaction';
import { BitcoinNetwork } from './interface';
import {
  Header,
  Divider,
  Icon,
  Grid,
  Segment,
  Button,
} from 'semantic-ui-react';
import { ChatList, MessageList, Input } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

function App() {
  const [connected, setConnectStatus] = useState(false);
  const [network, setNetwork] = useState<BitcoinNetwork>(BitcoinNetwork.Test);
  const [target, setTarget] = useState(undefined);
  const [value, setValue] = useState(undefined);
  const { feeRate } = useFeeRate(network);
  const { txList, addTx, refresh } = useTransaction(network);

  const [currentMessage, setCurrentMessage] = useState('');


  const connectCallback = () => setConnectStatus(true);

  const {
    utxoList,
    recieveAddressList,
    changeAddressList,
    setPubKey,
    loading,
    pubKey,
  } = useExtendedPubKey('', network);

  const utxoMap = countUtxo(utxoList);
  const address = addressAggrator(
    recieveAddressList,
    changeAddressList,
    utxoMap,
  );

  const onSendClick = async () => {
    try {
      console.log('eth address', target);
      const psbt = genreatePSBT(
        { address: target, value: btcToSatoshi(value) },
        utxoList,
        feeRate,
        {
          addressList: recieveAddressList.concat(changeAddressList),
          masterFingerprint: getNodeFingerPrint(pubKey),
          changeAddress:
            changeAddressList[changeAddressList.length - 1].address,
        },
        network,
      );
      const { txId, txHex } = await signPsbt(psbt.toBase64(), network);
      await sendTx(txHex, network);
      addTx(txId);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(String(error));
      }
    }
  };

  const messageListReferance = React.createRef();
  const inputReferance = React.createRef();

  return (
    <div className="App">
      <PageHeader
        connected={connected}
        onConnect={() => connect(connectCallback)}
      />
      {connected ? (
        <div className="container">
          <div className="chatList">
            <ChatList
              id={0}
              lazyLoadingImage={'false'}
              dataSource={[
                {
                    avatar: 'https://facebook.github.io/react/img/logo.svg',
                    alt: 'Reactjs',
                    title: 'Facebook',
                    subtitle: 'What are you doing?',
                    date: new Date(),
                    unread: 0,
                    id: 0
                },
                {
                  avatar: 'https://facebook.github.io/react/img/logo.svg',
                  alt: 'Reactjs',
                  title: 'Facebook',
                  subtitle: 'What are you doing?',
                  date: new Date(),
                  unread: 0,
                  id: 0
              }
              ]}
            />
          </div>
        <div className="messageList">
        <MessageList
          referance={messageListReferance}
          className='message-list'
          lockable={true}
          toBottomHeight={'100%'}
          downButton={false}
          downButtonBadge={0}
          sendMessagePreview={false}
          dataSource={[
              {
                  id: 0,
                  position: 'right',
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
                  date: new Date(),
                  title: '',
                  focus: false,
                  titleColor: 'black',
                  forwarded: false,
                  removeButton: true,
                  replyButton: false,
                  status: "sent",
                  notch: true,
                  retracted: false
              },
              {
                id: 1,
                position: 'left',
                type: 'text',
                text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
                date: new Date(),
                title: '',
                focus: false,
                titleColor: 'black',
                forwarded: false,
                removeButton: true,
                replyButton: false,
                status: "sent",
                notch: true,
                retracted: false
            }
          ]} />
          <Input
              maxHeight={100}
              minHeight={50}
              referance={inputReferance}
              placeholder="Type here..."
              multiline={true}
              rightButtons={<Button backgroundColor="black" text="Send" />}
          />
          </div>
          {/* <Address
            onGetPubkey={() => getExtendedPublicKey(network, setPubKey)}
            network={network}
            setNetwork={setNetwork}
            items={address}
            loading={loading}
            balance={satoshiToBTC(
              utxoList.reduce((acc, current) => acc + current.value, 0),
            )}
          /> */}

          {/* <Segment>
            <Grid columns={2} relaxed="very" stackable>
              <Grid.Column>
                <Header as="h3">Send Transaction</Header>
                <SendBox
                  feeRate={feeRate}
                  value={value}
                  target={target}
                  setTarget={setTarget}
                  setValue={setValue}
                  onSendClick={onSendClick}
                />
              </Grid.Column>
              <Grid.Column>
                <Header as="h3">BTC Address</Header>
                <AddressBox
                  address={
                    lastReceiveAddress ? lastReceiveAddress.address : undefined
                  }
                  path={
                    lastReceiveAddress ? lastReceiveAddress.path : undefined
                  }
                />
              </Grid.Column>
            </Grid>
            <Divider vertical>
              <Icon name="bitcoin" color="orange" />
            </Divider>
          </Segment>
          <Segment clearing>
            <Header as="h3" floated="left">
              Transactions
            </Header>
            <Header as="h3" floated="right">
              <Button icon="refresh" onClick={refresh}>
                <Icon name="refresh" />
              </Button>
            </Header>
            <TransactionList items={txList} network={network} />
          </Segment> */}
        </div>
      ) : (
        <Banner />
      )}
    </div>
  );
}

export default App;
