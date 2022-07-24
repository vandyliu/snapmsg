import { OnRpcRequestHandler } from '@metamask/snap-types';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin: originLocation,
  request,
}) => {
  console.info('request');
  console.info(request);
  switch (request.method) {
    case 'hello':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Hello, ${originLocation}!`,
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent:
              'But you can edit the snap source code to make it do something, if you want to!',
          },
        ],
      });
    case 'sendmsg':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Send Message?`,
            description: `Would you like to send the following message to ${(request.params as any).receiver}?`,
            textAreaContent: (request.params as any).message
          }
        ]
      })
    default:
      throw new Error('Method not found.');
  }
};
