const checkEnv = (env, type = 'global') => {
  const noRequiredEnv = Object.keys(env).filter(
    key => !process.env[key] && env[key] === type
  );
  if (noRequiredEnv[0]) {
    throw new Error('The required env is missing: ' + noRequiredEnv.join(', '));
  }
};

export default checkEnv;
