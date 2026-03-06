'use client';
import { Badge, Card } from '../ui'
import Table from '../ui/Table'

export default function SweepMetadataCard({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-info-circle mr-2"></i>
          Metadata
        </h5>
      </div>
      <div className="p-5">
        <Table>
          <tbody>
            {metadata.strategy &&
              <tr>
                <td className="text-surface-500 w-2/5">Strategy</td>
                <td>{metadata.strategy}</td>
              </tr>
              }
            {metadata.invoiceNumber &&
              <tr>
                <td className="text-surface-500">Invoice</td>
                <td>
                  <code>{metadata.invoiceNumber}</code>
                  {metadata.invoiceStatus &&
                  <Badge className="bg-surface-100 text-surface-600 ml-2">{metadata.invoiceStatus}</Badge>
                  }
                </td>
              </tr>
              }
            {metadata.paymentCount != null &&
              <tr>
                <td className="text-surface-500">Payment Count</td>
                <td>{metadata.paymentCount}</td>
              </tr>
              }
            {metadata.paymentIds &&
              <tr>
                <td className="text-surface-500">Payment IDs</td>
                <td>{metadata.paymentIds.join(', ')}</td>
              </tr>
              }
            {metadata.ledgerEntryIds &&
              <tr>
                <td className="text-surface-500">Ledger Entry IDs</td>
                <td>{metadata.ledgerEntryIds.join(', ')}</td>
              </tr>
              }
            {metadata.note &&
              <tr>
                <td className="text-surface-500">Note</td>
                <td>{metadata.note}</td>
              </tr>
              }
            {metadata.retryCount != null &&
              <tr>
                <td className="text-surface-500">Retry Count</td>
                <td>{metadata.retryCount}</td>
              </tr>
              }
            {metadata.jobName &&
              <tr>
                <td className="text-surface-500">Job</td>
                <td><code>{metadata.jobName}</code></td>
              </tr>
              }
          </tbody>
        </Table>
      </div>
    </Card>);

}