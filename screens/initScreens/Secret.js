import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { saveSecure, saveSecureValue } from '../../utils/secure.store';
import ImportShopPrivateKey from '../../components/ImportShopPrivateKey';
import { Box, VStack } from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader';
import { Wallet } from '@ethersproject/wallet';
import * as Device from 'expo-device';
import { getClient } from '../../utils/client';
import { AUTH_STATE } from '../../stores/user.store';
import { useTranslation } from 'react-i18next';
import ImportPrivateKey from '../../components/ImportPrivateKey';
import { registerPushTokenWithClient } from '../../utils/push.token';
import { WrapBox } from '../../components/styled/layout';
import { WrapButton } from '../../components/styled/button';
import { ActiveButtonText } from '../../components/styled/text';

const Secret = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { userStore, secretStore } = useStores();
  const [fromOtherWallet, setFromOtherWallet] = useState(false);
  const [nextScreen, setNextScreen] = useState('none');

  useEffect(() => {
    const nc =
      process.env.EXPO_PUBLIC_APP_KIND === 'shop' ? 'ShopReg' : 'PhoneAuth';
    setNextScreen(nc);
  }, []);

  async function createWallet() {
    const wallet = Wallet.createRandom();

    console.log('address :', wallet.address);
    console.log('mnemonic :', wallet.mnemonic);
    console.log('privateKey :', wallet.privateKey);

    await saveSecureValue('address', wallet.address);
    await saveSecureValue('mnemonic', JSON.stringify(wallet.mnemonic));
    await saveSecureValue('privateKey', wallet.privateKey);

    secretStore.setClient();

    if (Device.isDevice) {
      await registerPushTokenWithClient(
        secretStore.client,
        userStore,
        process.env.EXPO_PUBLIC_APP_KIND,
      );
      resetPinCode();
    } else {
      console.log('Not on device.');
      resetPinCode();
    }
  }

  async function tt() {
    userStore.setLoading(true);
    setTimeout(async () => {
      await createWallet();
    }, 100);
  }

  function resetPinCode() {
    userStore.setLoading(false);
    alert(t('secret.alert.wallet.done'));
    navigation.navigate(nextScreen);
  }

  async function saveKey(key) {
    await saveSecure(key, secretStore, t('secret.alert.wallet.invalid'));

    if (Device.isDevice) {
      await registerPushTokenWithClient(
        secretStore.client,
        userStore,
        process.env.EXPO_PUBLIC_APP_KIND,
      );
      resetPinCode();
    } else {
      console.log('Not on device.');
      resetPinCode();
    }
  }

  async function saveKeyForShop(key) {
    await saveSecure(key, secretStore, t('secret.alert.wallet.invalid'));

    userStore.setLoading(false);
    setFromOtherWallet(true);
  }

  async function afterSelectingShop() {
    if (Device.isDevice) {
      await registerPushTokenWithClient(
        secretStore.client,
        userStore,
        process.env.EXPO_PUBLIC_APP_KIND,
      );
      userStore.setAuthState(AUTH_STATE.DONE);
    } else {
      console.log('Not on device.');
      userStore.setAuthState(AUTH_STATE.DONE);
    }
  }

  return (
    <WrapBox style={{ backgroundColor: userStore.contentColor }}>
      <MobileHeader
        title={t('secret.header.title')}
        subTitle={t('secret.header.subtitle')}
      />
      <VStack mt={50}>
        <Box>
          <WrapButton onPress={tt}>
            <ActiveButtonText>{t('wallet.create')}</ActiveButtonText>
          </WrapButton>
        </Box>
        {nextScreen === 'ShopReg' ? (
          <ImportShopPrivateKey
            saveKey={saveKeyForShop}
            fromOtherWallet={fromOtherWallet}
            afterSelectingShop={afterSelectingShop}
            client={secretStore.client}
          />
        ) : (
          <ImportPrivateKey saveKey={saveKey} />
        )}
      </VStack>
    </WrapBox>
  );
});

export default Secret;
