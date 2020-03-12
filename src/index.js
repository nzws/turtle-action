import path from 'path';
import core from '@actions/core';
import { exec } from '@actions/exec';
import artifact from '@actions/artifact';
import selectManager from 'add-pkg/src/components/select-manager';
import managers from 'add-pkg/src/managers';

import checkEnv from './utils/check-env';
import base64ToBin from './utils/base642bin';

const envs = {
  expo_username: 'global',
  expo_password: 'global',

  // expo fetch:android:keystore
  android_ks_base64: 'android',
  android_ks_alias: 'android',
  android_ks_password: 'android',
  android_key_password: 'android',

  // expo fetch:ios:certs
  ios_apple_team_id: 'ios',
  ios_p12_base64: 'ios',
  ios_p12_password: 'ios',
  ios_provisioning_profile_base64: 'ios'
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

    await exec(manager.add.global.replace('{packages}', 'expo-cli'));
    const turtleVer = core.getInput('turtle_cli_version');
    await exec(
      manager.add.global.replace(
        '{packages}',
        turtleVer ? `turtle-cli@${turtleVer}` : 'turtle-cli'
      )
    );

    await exec(
      `expo login -u ${env.expo_username} -p ${env.expo_password} --non-interactive`
    );
    await exec(`${command} install --frozen-lockfile`);
    await exec('expo publish');

    const os = core.getInput('build_os', { required: true });
    const sdkVersion = core.getInput('expo_sdk_version', { required: true });

    let file = `./expo-${Date.now()}`;
    if (os === 'android') {
      checkEnv(envs, 'android');
      file += '.apk';

      await base64ToBin(env.android_ks_base64, 'expo-project.jks');

      await exec(`turtle setup:android --sdk-version ${sdkVersion}`);
      await exec(
        `turtle build:android --keystore-path ./expo-project.jks --keystore-alias ${env.android_ks_alias} --type apk -o ${file}`
      );
    } else if (os === 'ios') {
      checkEnv(envs, 'ios');
      file += '.ipa';

      await base64ToBin(env.ios_p12_base64, 'expo-project_dist.p12');
      await base64ToBin(
        env.ios_provisioning_profile_base64,
        'expo-project.mobileprovision'
      );

      await exec(`turtle setup:ios --sdk-version ${sdkVersion}`);
      await exec(
        `turtle build:ios --team-id ${env.ios_apple_team_id} --dist-p12-path ./expo-project_dist.p12 --provisioning-profile-path ./expo-project.mobileprovision -o ${file}`
      );
    } else {
      throw new Error('Unknown build os: ' + os);
    }

    await uploadArtifact(file, [file], '.');
  } catch (e) {
    core.setFailed(e.message);
  }
})();
