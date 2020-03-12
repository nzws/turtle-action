import path from 'path';
import core from '@actions/core';
import { exec } from '@actions/exec';
import * as artifact from '@actions/artifact';
import selectManager from 'add-pkg/src/components/select-manager';
import managers from 'add-pkg/src/managers';

import checkEnv from './utils/check-env';
import base64ToBin from './utils/base642bin';

const envs = {
  EXPO_USERNAME: 'global',
  EXPO_PASSWORD: 'global',

  // expo fetch:android:keystore
  EXPO_ANDROID_KEYSTORE_BASE64: 'android',
  EXPO_ANDROID_KEYSTORE_ALIAS: 'android',
  EXPO_ANDROID_KEYSTORE_PASSWORD: 'android',
  EXPO_ANDROID_KEY_PASSWORD: 'android',

  // expo fetch:ios:certs
  EXPO_APPLE_TEAM_ID: 'ios',
  EXPO_IOS_DIST_P12_BASE64: 'ios',
  EXPO_IOS_DIST_P12_PASSWORD: 'ios',
  EXPO_IOS_PROVISIONING_PROFILE_BASE64: 'ios'
};

const env = Object.keys(envs).map(key => process.env[key]);
const { uploadArtifact } = artifact.create();

(async () => {
  try {
    checkEnv(envs);

    const dir = core.getInput('working_dir');
    if (dir) {
      process.chdir(path.resolve(dir));
    }
    const manager = managers[await selectManager()];
    const command = manager.base;

    await exec(manager.add.global.replace('{packages}', 'expo-cli cross-env'));
    const turtleVer = core.getInput('turtle_cli_version');
    await exec(
      manager.add.global.replace(
        '{packages}',
        turtleVer ? `turtle-cli@${turtleVer}` : 'turtle-cli'
      )
    );

    await exec(
      `expo login -u ${env.EXPO_USERNAME} -p ${env.EXPO_PASSWORD} --non-interactive`
    );
    await exec(`${command} install --frozen-lockfile`);
    await exec('expo publish');

    const os = core.getInput('build_os', { required: true });
    const sdkVersion = core.getInput('expo_sdk_version', { required: true });

    let file = `./expo-${Date.now()}`;
    if (os === 'android') {
      checkEnv(envs, 'android');
      file += '.apk';

      await base64ToBin(env.EXPO_ANDROID_KEYSTORE_BASE64, 'expo-project.jks');

      await exec(`turtle setup:android --sdk-version ${sdkVersion}`);
      await exec(
        `cross-env EXPO_ANDROID_KEYSTORE_PASSWORD=${env.EXPO_ANDROID_KEYSTORE_PASSWORD} EXPO_ANDROID_KEY_PASSWORD=${env.EXPO_ANDROID_KEY_PASSWORD} ` +
          `turtle build:android --keystore-path ./expo-project.jks --keystore-alias ${env.EXPO_ANDROID_KEYSTORE_ALIAS} --type apk -o ${file}`
      );
    } else if (os === 'ios') {
      checkEnv(envs, 'ios');
      file += '.ipa';

      await base64ToBin(env.EXPO_IOS_DIST_P12_BASE64, 'expo-project_dist.p12');
      await base64ToBin(
        env.EXPO_IOS_PROVISIONING_PROFILE_BASE64,
        'expo-project.mobileprovision'
      );

      await exec(`turtle setup:ios --sdk-version ${sdkVersion}`);
      await exec(
        `cross-env EXPO_IOS_DIST_P12_PASSWORD=${env.EXPO_IOS_DIST_P12_PASSWORD} ` +
          `turtle build:ios --team-id ${env.EXPO_APPLE_TEAM_ID} --dist-p12-path ./expo-project_dist.p12 --provisioning-profile-path ./expo-project.mobileprovision -o ${file}`
      );
    } else {
      throw new Error('Unknown build os: ' + os);
    }

    await uploadArtifact(file, [file], '.');
  } catch (e) {
    core.setFailed(e.message);
  }
})();
