import {
  Input,
  InputField,
  Button,
  Heading,
  FormControl,
  ButtonText,
  useToast,
  VStack,
  Box,
  HStack,
  Text,
  Divider,
  FormControlLabel,
  FormControlLabelText,
  SelectInput,
  SelectTrigger,
  SelectIcon,
  Icon,
  SelectBackdrop,
  SelectPortal,
  SelectDragIndicatorWrapper,
  SelectContent,
  SelectItem,
  Select,
  SelectDragIndicator,
  ActionsheetItemText,
} from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native';
import { useFormik } from 'formik';
import * as yup from 'yup';
import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { AUTH_STATE } from '../../stores/user.store';
import { useStores } from '../../stores';
import '@ethersproject/shims';
import { ContractUtils, LoyaltyNetworkID } from 'dms-sdk-client';
import * as Clipboard from 'expo-clipboard';
import { getLocales, getCalendars } from 'expo-localization';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getClient } from '../../utils/client';
import { ChevronDownIcon } from 'lucide-react-native';
import MobileHeader from '../../components/MobileHeader';
import { useTranslation } from 'react-i18next';
import { WrapBox } from '../../components/styled/layout';
import { ActiveButtonText, SubHeaderText } from '../../components/styled/text';
import { WrapButton } from '../../components/styled/button';

const registerSchema = yup.object().shape({
  n1: yup.string().required(),
});

const registerInitialValues = {
  n1: '',
};

const ShopReg = observer(({ navigation }) => {
  const { t } = useTranslation();
  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');
  const { userStore } = useStores();

  useEffect(() => {
    async function fetchClient() {
      console.log('ShopReg > fetchClient');
      const { client, address } = await getClient('shopReg');
      setClient(client);
      setAddress(address);

      const web3Status = await client.web3.isUp();
      console.log('web3Status :', web3Status);
      const isUp = await client.ledger.isRelayUp();
      console.log('isUp:', isUp);
    }
    fetchClient()
      .then(() => console.log('end of fetchClient'))
      .catch((error) => {
        console.log(error);
      });
    // const deviceLocales = getLocales()[0];
    // console.log('deviceLocales :', deviceLocales);
    // // initiateTimer();
    // // alert('regionCode :' + JSON.stringify(deviceLocales));
    // userStore.setCurrency(deviceLocales.currencyCode.toLowerCase());
    // userStore.setLang(deviceLocales.languageCode.toLowerCase());
    // userStore.setCountry(deviceLocales.regionCode.toLowerCase());
    // userStore.setLangTag(deviceLocales.languageTag);
    // userStore.setCountryPhoneCode(
    //   deviceLocales.regionCode == 'KR' ? '82' : '82',
    // );
  }, []);

  async function regShop() {
    userStore.setLoading(true);
    const steps = [];
    try {
      // const shopId = await client.shop.makeShopId(
      //   address,
      //   LoyaltyNetworkID.KIOS,
      // );
      const shopId = ContractUtils.getShopId(address, LoyaltyNetworkID.KIOS);
      console.log('shopId :', shopId);
      userStore.setShopId(shopId);
      userStore.setShopName(formik.values?.n1);
      const shopData = {
        shopId,
        name: formik.values?.n1,
        currency: userStore.currency,
      };
      console.log('ShopData : ', shopData);

      for await (const step of client.shop.add(
        shopData.shopId,
        shopData.name,
        shopData.currency,
      )) {
        steps.push(step);
        console.log('submit step :', step);
      }
      alert(t('shop.alert.reg.done'));
      userStore.setLoading(false);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      userStore.setLoading(false);
      alert(t('shop.alert.reg.fail'));
    }
  }

  const formik = useFormik({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,

    onSubmit: (values, { resetForm }) => {
      console.log('form values :', values);
      regShop().then((r) => {
        userStore.setAuthState(AUTH_STATE.DONE);
      });
      resetForm();
    },
  });

  const onPressCurrency = (it) => {
    console.log('it:', it);
    userStore.setCurrency(it);
  };
  return (
    <WrapBox style={{ backgroundColor: userStore.contentColor }}>
      <KeyboardAwareScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        // style={{ marginBottom: 150 }}
        enableOnAndroid={true}
        scrollEnabled={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps='handled'
        scrollToOverflowEnabled={true}
        enableAutomaticScroll={true}>
        <MobileHeader
          title={t('shop.header.title')}
          subTitle={t('shop.header.subtitle')}></MobileHeader>

        <VStack mt={50}>
          <FormControl
            size='md'
            isRequired={true}
            isInvalid={!!formik.errors.n1}>
            <FormControlLabel mb='$1'>
              <SubHeaderText style={{ color: '#555555' }}>
                {t('shop.body.text.a')}
              </SubHeaderText>
            </FormControlLabel>
            <Input
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: '#E4E4E4',
              }}>
              <InputField
                style={{
                  fontFamily: 'Roboto-Medium',
                  lineHeight: 20,
                  fontSize: 15,
                  color: '#12121D',
                }}
                type='text'
                placeholder={t('shop.body.text.a')}
                onChangeText={formik.handleChange('n1')}
                onBlur={formik.handleBlur('n1')}
                value={formik.values?.n1}
              />
            </Input>
          </FormControl>
          <FormControl size='md' isRequired={true} mt={15}>
            <FormControlLabel mb='$1'>
              <SubHeaderText style={{ color: '#555555' }}>
                {t('shop.body.text.b')}
              </SubHeaderText>
            </FormControlLabel>
            <Select
              onValueChange={onPressCurrency}
              selectedValue={userStore.currency}
              selectedLabel={userStore.currency.toUpperCase()}>
              <SelectTrigger
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: '#E4E4E4',
                }}>
                <SelectInput
                  placeholder='Select option'
                  style={{
                    fontFamily: 'Roboto-Medium',
                    lineHeight: 16,
                    fontSize: 15,
                    color: '#12121D',
                  }}
                />
                <SelectIcon mr='$3'>
                  <Icon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent h={300}>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem
                    label='KRW'
                    value='krw'
                    defaultValue={true}></SelectItem>
                  <SelectItem label='USD' value='usd' isDisabled={false} />
                  <SelectItem label='PHP' value='php' isDisabled={false} />
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>
          <WrapButton
            isDisabled={formik.values?.n1 === ''}
            bg={formik.values?.n1 === '' ? '#E4E4E4' : '#5C66D5'}
            onPress={formik.handleSubmit}
            my='$4'>
            <ActiveButtonText>{t('shop.create')}</ActiveButtonText>
          </WrapButton>
        </VStack>
      </KeyboardAwareScrollView>
    </WrapBox>
  );
});

export default ShopReg;
