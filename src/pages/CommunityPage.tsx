import './CommunityPage.css'

export default function CommunityPage() {
  return (
    <div className="community-page">
      <h1 className="community-page-title">Community</h1>
      <p className="community-page-lead">
        Discover user-made variants and shared challenge lists. This section is the home for community
        publishing and browsing.
      </p>
      <section className="community-page-section" aria-labelledby="community-upcoming">
        <h2 id="community-upcoming" className="community-page-h2">
          Coming next
        </h2>
        <p className="community-page-p">
          Public variant feeds, creator profiles, and upvote-based discovery will appear here.
        </p>
      </section>
    </div>
  )
}
