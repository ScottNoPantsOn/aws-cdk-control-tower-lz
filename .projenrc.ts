import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.162.0',
  defaultReleaseBranch: 'main',
  name: 'aws-cdk-control-tower-lz',
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});

const common_exclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'coverage',
  '.DS_Store',
  'config/*',
  'lib',
  '*.js',
  '*.js.map',
  '*.d.ts',
  '.idea',
];

project.gitignore.exclude(...common_exclude);
project.npmignore?.exclude(...common_exclude);

project.synth();