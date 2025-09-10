import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const client = await clientPromise;
    const db = client.db('allthingbucket');
    
    if (req.method === 'GET') {
      // 쿼리 조건 설정
      const query = {};
      
      if (req.query.campaign_id) {
        query._id = req.query.campaign_id;
      }
      
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      if (req.query.category) {
        query.type = req.query.category;
      }
      
      let cursor = db.collection('campaigns').find(query);
      
      if (req.query.limit) {
        cursor = cursor.limit(parseInt(req.query.limit));
      }
      
      cursor = cursor.sort({ created_at: -1 });
      
      const campaigns = await cursor.toArray();
      
      return res.status(200).json({ 
        success: true, 
        data: campaigns,
        count: campaigns.length
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API 에러:', error);
    
    // Fallback 데이터 반환
    const fallbackCampaigns = [
      {
        _id: "campaign_1",
        title: "뷰티 제품 체험단 모집",
        description: "새로운 뷰티 제품을 체험해보실 분들을 모집합니다.",
        type: "beauty",
        status: "active",
        max_participants: 50,
        current_participants: 15,
        start_date: "2024-01-01T00:00:00.000+00:00",
        end_date: "2024-12-31T00:00:00.000+00:00",
        application_start: "2024-01-01T00:00:00.000+00:00",
        application_end: "2024-12-15T00:00:00.000+00:00",
        content_start: "2024-01-01T00:00:00.000+00:00",
        content_end: "2024-12-20T00:00:00.000+00:00",
        requirements: "인스타그램 팔로워 1만명 이상",
        rewards: "제품 무료 제공 + 포인트 1000P",
        main_images: ["https://example.com/beauty1.jpg"],
        detail_images: ["https://example.com/beauty_detail1.jpg", "https://example.com/beauty_detail2.jpg"],
        created_at: "2025-09-10T01:59:07.897+00:00",
        updated_at: "2025-09-10T01:59:07.897+00:00"
      },
      {
        _id: "campaign_2",
        title: "테크 가전 제품 리뷰",
        description: "최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다.",
        type: "tech",
        status: "active",
        max_participants: 30,
        current_participants: 8,
        start_date: "2024-01-01T00:00:00.000+00:00",
        end_date: "2024-12-31T00:00:00.000+00:00",
        application_start: "2024-01-01T00:00:00.000+00:00",
        application_end: "2024-12-10T00:00:00.000+00:00",
        content_start: "2024-01-01T00:00:00.000+00:00",
        content_end: "2024-12-15T00:00:00.000+00:00",
        requirements: "유튜브 구독자 5천명 이상",
        rewards: "제품 무료 제공 + 포인트 2000P",
        main_images: ["https://example.com/tech1.jpg"],
        detail_images: ["https://example.com/tech_detail1.jpg"],
        created_at: "2025-09-10T01:59:07.897+00:00",
        updated_at: "2025-09-10T01:59:07.897+00:00"
      }
    ];
    
    res.status(200).json({ 
      success: false,
      fallback: true,
      data: fallbackCampaigns,
      count: fallbackCampaigns.length,
      error: error.message 
    });
  }
}
