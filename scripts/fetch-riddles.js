// scripts/fetch-riddles.js
import fs from 'fs/promises';
import path from 'path';

// Your GraphQL query
const GET_RIDDLES_QUERY = `
    query NewQuery {
        peheliyan {
            nodes {
                paheliyaanFields {
                    paheliInUrdu
                    paheliInRomanUrdu
                    paheliAnswer
                    paheliContributedBy
                }
                paheliCategories {
                    nodes {
                        count
                        name
                        description
                        link
                        seo {
                            breadcrumbTitle
                            canonicalUrl
                            description
                            title
                            robots
                            openGraph {
                                description
                                siteName
                                title
                                type
                            }
                        }
                    }
                }
            }
        }
    }
`;

const WP_GRAPHQL_URL = 'https://yourdomain.com/graphql';

async function fetchRiddles() {
    try {
        const response = await fetch(WP_GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: GET_RIDDLES_QUERY }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const allRiddles = json.data.peheliyan.nodes;

        // Group riddles by category
        const riddlesByCategory = {};
        allRiddles.forEach(riddle => {
            riddle.paheliCategories.nodes.forEach(category => {
                const categoryName = category.name.toLowerCase().replace(/\s/g, '-');
                if (!riddlesByCategory[categoryName]) {
                    riddlesByCategory[categoryName] = {
                        category: category,
                        riddles: []
                    };
                }
                riddlesByCategory[categoryName].riddles.push(riddle.paheliyaanFields);
            });
        });

        const outputDir = path.join(process.cwd(), 'src', 'data');
        await fs.mkdir(outputDir, { recursive: true });

        for (const [categorySlug, data] of Object.entries(riddlesByCategory)) {
            const filePath = path.join(outputDir, `${categorySlug}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Wrote data for category: ${categorySlug}`);
        }

    } catch (error) {
        console.error('❌ Error fetching data:', error);
    }
}

fetchRiddles();