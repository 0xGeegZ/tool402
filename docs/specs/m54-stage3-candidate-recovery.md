# M54 Stage 3 candidate recovery

## Outcome

The Provider deploy screen can explicitly revalidate a previously submitted,
public Stage-B transaction hash after reload and restore only a fully
corroborated session-local candidate. The recovered candidate merely enables
the existing separately clicked `external.attachCandidate` signature. It never
causes a transaction, signature, relay, attachment, persistence write, or
automatic recovery.

## Recovery contract

1. Recovery accepts only a canonical lower-case `0x` transaction hash supplied
   by an explicit user action.
2. The recovery branch performs public receipt/Mirror reads only. It does not
   call `eth_sendTransaction`, request an account, or inspect a wallet.
3. It returns a candidate only when the existing fixed chain, issuer, Factory,
   successful transaction, exactly one valid fixed-Factory `BondDeployed`
   event, Mirror transaction identity, final corroboration, and existing
   normalized candidate checks all pass.
4. Pending, absent, malformed, foreign, failed, zero-address, or ambiguous
   evidence returns no candidate and cannot expose an attachment request.
5. Candidate and public hash presentation remain page-session data. A later
   reload offers explicit recovery again; neither browser storage nor a durable
   write is introduced.

## Closed relay feedback

- The final result of a Stage 3 signature survives dialog dismissal in the
  existing stage state surface.
- `not_configured` means the local relay declined before forwarding: nothing
  left the host and nothing was recorded.
- `transport_failure` and `unexpected_response` mean the final backend state
  is unknown. They do not imply a rejection and do not create a retry,
  transaction, or signature request.
- `ACCEPTED`, `REPLAYED`, `CONFLICT`, `REJECTED`, and `UNSUPPORTED_TYPE` retain
  their current closed meanings.

## Exclusions

M54 does not alter the command relay, EIP-712 payload, signature dialog,
backend attachment mutation, public offering projection, Stage 4 durable
continuation, configuration, credentials, browser storage, or any human-owned
wallet/live action.

## Acceptance

Injected tests must prove a valid hash returns one candidate without provider
or relay calls, and every invalid public-evidence variant returns none. UI
tests must prove recovery is explicit and inaccessible to automatic effects,
and that the three closed unavailable/unknown outcomes remain visible after a
dialog result. Local browser proof must use only injected/static state and must
not open MetaMask, request a signature, relay a command, or submit a
transaction.
