/**
 * AmountNormalizer Browser Compatibility Test
 * ทดสอบการใช้งานใน React Component
 */

import { useState } from 'react'
import { AmountNormalizer } from './amount_normalizer'

export default function AmountNormalizerTest() {
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const runTests = () => {
    try {
      // Test 1: Convert ETH to Wei
      const eth = '1.5'
      const wei = AmountNormalizer.toRaw(eth, 'ETH', 18)
      console.log('✅ Test 1: toRaw -', { eth, wei })

      // Test 2: Convert Wei to ETH
      const backToEth = AmountNormalizer.fromRaw(wei, 'ETH', 18)
      console.log('✅ Test 2: fromRaw -', { wei, backToEth })

      // Test 3: Add amounts
      const sum = AmountNormalizer.add('1.5', '2.3', 'ETH', 18)
      console.log('✅ Test 3: add -', { sum })

      // Test 4: Compare amounts
      const comparison = AmountNormalizer.compare('1.5', '2.0', 'ETH', 18)
      console.log('✅ Test 4: compare -', { comparison })

      // Test 5: Detect chain
      const chain = AmountNormalizer.detectChain('USDT', 'POLYGON')
      console.log('✅ Test 5: detectChain -', { chain })

      // Test 6: Simple conversion (no external libs)
      const raw = AmountNormalizer.toRawSimple('1.5', 18)
      const decimal = AmountNormalizer.fromRawSimple(raw, 18)
      console.log('✅ Test 6: simple conversion -', { raw, decimal })

      // Test 7: BigInt arithmetic
      const rawBigInt = AmountNormalizer.toRawBigInt('1.5', 18)
      const total = rawBigInt + AmountNormalizer.toRawBigInt('2.5', 18)
      const totalDecimal = AmountNormalizer.fromRawBigInt(total, 18)
      console.log('✅ Test 7: BigInt arithmetic -', { totalDecimal })

      setResult('✅ All tests passed! Check console for details.')
      setError('')
    } catch (err: any) {
      console.error('❌ Test failed:', err)
      setError(err.message)
      setResult('')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>AmountNormalizer Browser Test</h2>
      <p>ทดสอบว่า AmountNormalizer ทำงานใน browser ได้หรือไม่</p>
      
      <button 
        onClick={runTests}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Run Tests
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px'
        }}>
          {result}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          ❌ Error: {error}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Example Usage:</h3>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`// Convert ETH to Wei
const wei = AmountNormalizer.toRaw('1.5', 'ETH', 18)
// "1500000000000000000"

// Convert Wei to ETH
const eth = AmountNormalizer.fromRaw(wei, 'ETH', 18)
// "1.5"

// Add amounts
const sum = AmountNormalizer.add('1.5', '2.3', 'ETH', 18)
// "3.8"

// Simple conversion (no dependencies)
const raw = AmountNormalizer.toRawSimple('1.5', 18)
const decimal = AmountNormalizer.fromRawSimple(raw, 18)

// BigInt arithmetic
const a = AmountNormalizer.toRawBigInt('1.5', 18)
const b = AmountNormalizer.toRawBigInt('2.5', 18)
const total = a + b
const result = AmountNormalizer.fromRawBigInt(total, 18)`}
        </pre>
      </div>
    </div>
  )
}
