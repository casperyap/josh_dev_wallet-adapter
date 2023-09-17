import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo, useRef } from 'react';
import idl from './idl.json';
import { Program, web3, AnchorProvider, BN } from '@coral-xyz/anchor';
import * as buffer from "buffer";

require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

window.Buffer = buffer.Buffer;

const App: FC = () => {  
  return (
      <Context>
          <Content />
      </Context>
  );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
      () => [
          /**
           * Wallets that implement either of these standards will be available automatically.
           *
           *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
           *     (https://github.com/solana-mobile/mobile-wallet-adapter)
           *   - Solana Wallet Standard
           *     (https://github.com/solana-labs/wallet-standard)
           *
           * If you wish to support a wallet that supports neither of those standards,
           * instantiate its legacy wallet adapter here. Common legacy adapters can be found
           * in the npm package `@solana/wallet-adapter-wallets`.
           */
          new UnsafeBurnerWalletAdapter(),
          new PhantomWalletAdapter()
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [network]
  );

  return (
      <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
      </ConnectionProvider>
  );
};

const Content: FC = () => {
  const inputRef = useRef<HTMLInputElement>(null); 
  const outputRef = useRef<HTMLLabelElement>(null);
  const wallet = useAnchorWallet();
  const baseAccount = web3.Keypair.generate();

  let provider: any = null;
  let program: any = null;
 
  function getProvider() {
    if (!wallet) {
      console.log('Wallet is null!');
      return null;
    } 

    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, "processed");

    if (connection == null)
    {
      console.log('Connection is null!');
    }
    else {
      console.log('Connection is OK!!');
    }

    // Use a local provider.
    const provider = new AnchorProvider(
        connection, wallet, {"preflightCommitment": "processed"},
      );

    return provider;    
  }

  function initProviderProgram(){
    if (!provider){
      provider = getProvider();

      if (!provider){
        throw("Provider is null");
      }
    }

    if (program == null) {
      // Create a program interface combing the idl, program ID, and provider.
      // Bug with default importing when handling string value types, fix by re-converting to json.
      const a = JSON.stringify(idl);
      const b = JSON.parse(a);
      program = new Program(b, idl.metadata.address, provider);
    }
  }

  async function createCounter(evt: React.MouseEvent<HTMLButtonElement>) {
    evt.preventDefault();    
      
    initProviderProgram();

    try {
      // Interact with the program via rpc.
      await program.methods
      .initialize()
      .accounts({
        myAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([baseAccount])
      .rpc();

      const account = await program.account.myAccount.fetch(baseAccount.publicKey);
      console.log('Account: ', account);

      if (outputRef.current != null){
        outputRef.current.innerText = "Value initialised to " + account.data;
      }
    }
    catch (err) {
      console.log('Transaction error: ', err);
    }

  }
  
  async function increment(evt: React.MouseEvent<HTMLButtonElement>){
    evt.preventDefault(); 

    initProviderProgram();

    try {
      // Interact with the program via rpc.
      await program.methods
      .increment()
      .accounts({
        myAccount: baseAccount.publicKey,       
      })      
      .rpc();

      const account = await program.account.myAccount.fetch(baseAccount.publicKey);
      console.log('Account: ', account);

      if (outputRef.current != null){
        outputRef.current.innerText = "Value increment to " + account.data;
      }
    }
    catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function decrement(evt: React.MouseEvent<HTMLButtonElement>){
    evt.preventDefault(); 

    initProviderProgram();

    try {
      // Interact with the program via rpc.
      await program.methods
      .decrement()
      .accounts({
        myAccount: baseAccount.publicKey,
      })
      .rpc();

      const account = await program.account.myAccount.fetch(baseAccount.publicKey);
      console.log('Account: ', account);

      if (outputRef.current != null){
        outputRef.current.innerText = "Value decrement to " + account.data;
      }
    }
    catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function setValue(evt: React.MouseEvent<HTMLButtonElement>){
    evt.preventDefault(); 

    initProviderProgram();

    let set_value = 0;
    if (inputRef.current == null)
    {
      if (outputRef.current != null)
      {
        outputRef.current.innerText = "Input value cannot be empty";
      }
      return;
    }
    else {
      set_value = Number(inputRef.current.value)
    }

    try {
      // Interact with the program via rpc.
      await program.methods
      .set(new BN(set_value))
      .accounts({
        myAccount: baseAccount.publicKey,
      })
      .rpc();

      const account = await program.account.myAccount.fetch(baseAccount.publicKey);
      console.log('Account: ', account);

      if (outputRef.current != null){
        outputRef.current.innerText = "Value decrement to " + account.data;
      }

      inputRef.current.value = "";
    }
    catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  return (
    <div className="App">
      <table>
        <tr>
          <td><WalletMultiButton /></td>
        </tr>
        <tr>
          <td><button onClick={createCounter}>Initialize</button></td>
        </tr>
        <tr>
          <td><button onClick={increment}>Increment</button></td>
        </tr>
        <tr>
          <td><button onClick={decrement}>Decrement</button></td>
        </tr>
        <tr>
          <td>
            <input
              pattern="[0-9]" 
              ref={inputRef} 
              type="number" 
              placeholder="Type a number" 
            /> 
            <button onClick={setValue}>Set</button>
          </td>
        </tr>
        <tr className = "labelrow">
          <td><label ref={outputRef}></label></td>
        </tr>
      </table>
    </div>
  );
};
