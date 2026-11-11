import {prepare} from "../scripts/test-database.mjs";
export default async function setup(){await prepare("grove_tests");}
