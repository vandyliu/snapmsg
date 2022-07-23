import { useState, useEffect } from 'react';
import { Address, BitcoinNetwork, Utxo } from '../interface';
import { generateReceiveAddress, generateChangeAddress } from '../lib';
import { BlockChair } from '../lib/explorer';
import { BACKENDAPI } from '../config';
import {PrivyClient, SiweSession} from '@privy-io/privy-browser';
import { EthereumProvider } from '@privy-io/privy-browser/dist/sessions/siwe';

export const useExtendedPubKey = (
  extendedPubKey: string,
  network: BitcoinNetwork,
) => {
  const [pubKey, setPubKey] = useState(extendedPubKey);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const [utxoList, setUTXOList] = useState<Utxo[]>([]);
  const [recieveAddressList, setRecieveList] = useState<Address[]>([]);
  const [changeAddressList, setChangeList] = useState<Address[]>([]);

  const refresh = () => {
    setCount(count + 1);
  };

  useEffect(() => {
    console.log('about to put');
    const put = async () => {
      if (pubKey.length > 0) {
        const apiKey = BACKENDAPI;
        const explorer = new BlockChair(apiKey, network);
        setLoading(true);
        console.log('putting');

        const add1 = '0x7e16bef6d32C8611Bd015C88547d16e188208528'
        const add2 = '0xF19B1E161e645c0bd00E037DAe9a99D25A89E2b9'

        const PRIVY_API_KEY = 'dqubqwb2qQQqDemJ_RnkInt-HdBpv17T-3-v763ZYQA=';
        const PRIVY_API_SECRET = 'JNklWXmy93wVPbIJ_WlBLgNurR6371Z49DwgSDVY_hw=';
        const session = new SiweSession(PRIVY_API_KEY, window.ethereum as unknown as EthereumProvider);
        const client = new PrivyClient({session: session});

        const result = await client.put(add2, [
          {field: "first-name", value: "Jane"}]);
        console.log('done putting');
        explorer
          .getStatus(pubKey, true)
          .then((data) => {
            setLoading(false);
            setUTXOList(data.utxos);
            setRecieveList(
              generateReceiveAddress(pubKey, 0, data.recieveMax + 1),
            );
            setChangeList(generateChangeAddress(pubKey, 0, data.changeMax + 1));
          })
          .catch((e) => {
            console.error(e);
            setLoading(false);
          });
      }
    }
  put().catch(e => {console.error(e)});
  }, [pubKey, count]);

  useEffect(() => {
    setUTXOList([]);
    setRecieveList([]);
    setChangeList([]);
  }, [network]);

  return {
    utxoList,
    recieveAddressList,
    changeAddressList,
    setPubKey,
    refresh,
    loading,
    pubKey,
  };
};
