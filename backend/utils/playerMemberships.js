function membershipPriority(type) {
    switch (type) {
        case 'club':
            return 1;
        case 'country':
            return 2;
        case 'loan':
            return 3;
        case 'academy':
            return 4;
        default:
            return 5;
    }
}

function syncPlayerPrimaryMembership(db, playerId) {
    const memberships = db.prepare(`
        SELECT ptm.team_id, ptm.jersey_number, ptm.position, ptm.membership_type, ptm.start_date
        FROM player_team_memberships ptm
        WHERE ptm.player_id = ? AND ptm.is_active = 1
    `).all(playerId);

    memberships.sort((a, b) => {
        const priorityDelta = membershipPriority(a.membership_type) - membershipPriority(b.membership_type);
        if (priorityDelta !== 0) return priorityDelta;

        const aDate = a.start_date || '';
        const bDate = b.start_date || '';
        return bDate.localeCompare(aDate);
    });

    const primary = memberships[0];

    db.prepare(`
        UPDATE players
        SET team_id = ?, jersey_number = ?, position = ?
        WHERE player_id = ?
    `).run(
        primary ? primary.team_id : null,
        primary ? (primary.jersey_number ?? null) : null,
        primary ? (primary.position ?? null) : null,
        playerId,
    );
}

module.exports = { syncPlayerPrimaryMembership };
