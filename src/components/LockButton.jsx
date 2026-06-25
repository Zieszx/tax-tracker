/**
 * LockButton.jsx — Task 2.4
 *
 * A compact button in the header/topbar that calls vault.lock().
 * Shows a padlock icon + accessible label.
 */

import { useVault } from '../security/useVault.jsx'
import Button from './Button.jsx'

export default function LockButton() {
  const { lock } = useVault()
  return (
    <Button
      variant="ghost"
      className="lock-btn-header"
      onClick={lock}
      aria-label="Lock app"
      title="Lock app"
    >
      🔒 Lock
    </Button>
  )
}
