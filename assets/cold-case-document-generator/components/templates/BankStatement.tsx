import React from 'react';
import { BankStatementData } from '../../types';

interface Props {
  data: BankStatementData;
}

export const BankStatementTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white text-black p-16 font-digital flex flex-col relative box-border overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-4 border-gray-800 pb-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-900 transform rotate-45"></div>
                <h1 className="text-4xl font-bold uppercase tracking-tighter text-gray-900">{data.bankName}</h1>
            </div>
            <p className="text-sm text-gray-500 uppercase tracking-widest pl-1">Financial Services • Member FDIC</p>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-light uppercase mb-1">Account Statement</h2>
            <p className="text-gray-600">{data.statementPeriod}</p>
        </div>
      </div>

      {/* Account Summary */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8 flex justify-between items-center shadow-sm">
         <div>
            <p className="text-xs font-bold uppercase text-gray-500 mb-1">Account Holder</p>
            <p className="text-xl font-bold">{data.accountHolder}</p>
            <p className="text-sm font-mono-tech text-gray-600 mt-1">{data.accountNumber}</p>
         </div>
         
         <div className="flex gap-12 text-right">
             <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Beginning Balance</p>
                <p className="text-xl font-mono-tech">{data.startingBalance}</p>
             </div>
             <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Ending Balance</p>
                <p className="text-2xl font-bold font-mono-tech">{data.endingBalance}</p>
             </div>
         </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1">
        <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-2 mb-4">Transaction Activity</h3>
        
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="text-xs font-bold uppercase text-gray-500 border-b border-gray-300">
                    <th className="py-2 w-32">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 w-32 text-right">Amount</th>
                </tr>
            </thead>
            <tbody className="font-mono-tech text-sm">
                {data.transactions.map((tx, i) => (
                    <tr key={i} className="border-b border-gray-100 odd:bg-gray-50">
                        <td className="py-3 px-1">{tx.date}</td>
                        <td className="py-3 px-1 font-digital font-medium text-gray-700">{tx.description}</td>
                        <td className={`py-3 px-1 text-right font-bold ${tx.type === 'CREDIT' ? 'text-green-700' : 'text-gray-900'}`}>
                            {tx.type === 'DEBIT' ? '-' : '+'}{tx.amount}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>Please report any discrepancies within 30 days of the statement date.</p>
        <p className="mt-1 font-mono-tech">{data.bankName} - Generated Record Ref: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
      </div>
    </div>
  );
};