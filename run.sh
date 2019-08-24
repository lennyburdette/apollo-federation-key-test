#!/usr/bin/env bash

node service-a.js &
A=$!
node service-b.js &
B=$!

function finish {
  kill $A
  kill $B
}
trap finish EXIT

sleep 1

exec node gateway.js
