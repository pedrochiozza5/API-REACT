import test from 'node:test';
import assert from 'node:assert/strict';
import { productMediaUrls } from '../src/lib/productMedia.ts';
import { makeWhatsappMessage } from '../server/orderMessage.ts';

test('single cover produces one slide', () => {
  assert.deepEqual(productMediaUrls({imageUrl:'/one.webp',images:[]}), ['/one.webp']);
});

test('multiple images stay ordered without repeating cover', () => {
  const product={imageUrl:'/main.webp',images:[
    {imageUrl:'/other.webp'},{imageUrl:'/main.webp'},
    {imageUrl:'/third.webp'},{imageUrl:'/other.webp'},
  ]};
  assert.deepEqual(productMediaUrls(product), ['/main.webp','/other.webp','/third.webp']);
});

test('variant cover and variant gallery are isolated from generic product media', () => {
  const product={imageUrl:'/main.webp',images:[{imageUrl:'/detail.webp'}]};
  const variant={imageUrl:'/blue.webp',images:[{imageUrl:'/blue-detail.webp'},{imageUrl:'/main.webp'}]};
  assert.deepEqual(productMediaUrls(product,variant), ['/blue.webp','/blue-detail.webp','/main.webp']);
});

test('variant with its own gallery but no cover stays variant-specific', () => {
  assert.deepEqual(productMediaUrls(
    { imageUrl:'/generic.webp', images:[{imageUrl:'/generic-detail.webp'}] },
    { imageUrl:null, images:[{imageUrl:'/red.webp'},{imageUrl:'/red-detail.webp'}] }
  ), ['/red.webp','/red-detail.webp']);
});

test('variant without media inherits the generic gallery', () => {
  assert.deepEqual(productMediaUrls(
    {imageUrl:'/generic.webp',images:[{imageUrl:'/generic-detail.webp'}]},
    {imageUrl:null,images:[]}
  ), ['/generic.webp','/generic-detail.webp']);
});

test('missing media and whitespace do not produce blank slides', () => {
  assert.deepEqual(productMediaUrls({
    imageUrl:null,images:[{imageUrl:' '},{imageUrl:'/mate.webp'},{imageUrl:'/mate.webp'}],
  }), ['/mate.webp']);
});

test('WhatsApp order contains customer, pickup, items and total', () => {
  const message=makeWhatsappMessage({
    customerName:'Cliente de prueba', deliveryType:'pickup', total:30000,
  },[{qty:2,productName:'Mate',variantValue:'Negro'}]);
  assert.match(message,/Cliente de prueba/);
  assert.match(message,/Retiro/);
  assert.match(message,/2x Mate — Negro/);
  assert.match(message,/30\.000/);
});

test('shipping message includes customer address and every item', () => {
  const message=makeWhatsappMessage({
    customerName:'Ana',deliveryType:'shipping',address:'Calle 123',total:45000,
  },[{qty:1,productName:'Mate'},{qty:1,productName:'Yerba'}]);
  assert.match(message,/Envío — Calle 123/);
  assert.match(message,/1x Mate/);
  assert.match(message,/1x Yerba/);
});
