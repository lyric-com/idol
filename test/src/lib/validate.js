#! /usr/bin/env babel-node

import { allOptionalAssembled as Assembled } from './idol/codegen/all/optional';
import fs from 'fs';

var data = fs.readFileSync(0, 'utf-8');
data = JSON.parse(data);

// Assembled.validate(data);

if (!Assembled.isValid(data)) {
    process.exit(1);
}

