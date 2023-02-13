import { Alert, Button, StyleSheet } from "react-native";
import crypto from "crypto";
import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";
import { RootTabScreenProps } from "../types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { formatBalance } from "@polkadot/util";
import { useEffect, useState } from "react";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";
import {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  ed25519PairFromSeed,
  cryptoWaitReady,
  sr25519PairFromSeed,
  ed25519Verify,
  sr25519Verify,
  sr25519Sign,
  sr25519VrfSign,
  signatureVerify,
} from "@polkadot/util-crypto";
import { faker } from "@faker-js/faker";

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const [first, setfirst] = useState("");
  const Ogous = "5GNxB6nKvQBQn5a9JuCbMLDwEWTpMrtgdRRXZHPuzHbxSaht";
  const limit = 100;
  async function validateAll() {
    for (let i = 0; limit > i; i++) {
      const m = await mnemonicGenerate(12);

      const a = mnemonicToMiniSecret(m);
      const value = sr25519PairFromSeed(a);

      const text = faker.lorem.sentence();

      const message = crypto.createHash("sha256").update(text).digest("hex");

      const signature = sr25519Sign(text, {
        secretKey: value.secretKey,
        publicKey: value.publicKey,
      });

      const data = {
        message,
        signature: Buffer.from(signature).toString("base64"),
        publicKey: Buffer.from(value.publicKey).toString("base64"),
      };

      await fetch("http://localhost:3000", {
        method: "POST",
        body: JSON.stringify(data),
      });
      console.log(limit - 1 === i ? `FINISHED` : `RUNNING on ${i}`);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const wsProvider = new WsProvider("wss://mainnet.ternoa.io");

        const api = await ApiPromise.create({ provider: wsProvider });
        const {
          data: { free },
        } = (await api.query.system.account(Ogous)) as any;

        api.rpc.chain.subscribeNewHeads((header) => {
          setfirst(
            `Chain is at #${
              header.number
            } \r\n ${api.genesisHash.toHex()} \r\n\r\n ${formatBalance(free, {
              decimals: 18,
              withUnit: "CAPS",
            })}`
          );
        });
      } catch (e) {
        Alert.alert(JSON.stringify(e));
      }
    }
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{first}</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Button onPress={validateAll} title="Sign Messages and Validate" />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "blue",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
