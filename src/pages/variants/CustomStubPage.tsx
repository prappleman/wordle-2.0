import { Link } from 'react-router-dom'
import './CustomStubPage.css'

export default function CustomStubPage() {
  return (
    <div className="custom-stub">
      <h1 className="custom-stub-title">Custom variant</h1>
      <p className="custom-stub-text">
        This route is a stub for modes that do not use the classic grid. Replace this screen with
        your own component and keep the entry in <code>variants/registry.ts</code>.
      </p>
      <Link to="/" className="custom-stub-link">
        ← Back to hub
      </Link>
    </div>
  )
}
