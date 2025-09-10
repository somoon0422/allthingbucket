import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 캠페인 신청 요청:', req.body);
    
    const client = await clientPromise;
    const db = client.db('allthingbucket');
    
    // 신청 데이터 저장
    const application = {
      campaignId: req.body.campaignId,
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      socialMedia: req.body.socialMedia,
      applicationDate: new Date(),
      status: 'pending'
    };
    
    const result = await db.collection('applications').insertOne(application);
    
    res.status(200).json({ 
      success: true, 
      message: '신청이 완료되었습니다!',
      applicationId: result.insertedId 
    });
    
  } catch (error) {
    console.error('신청 저장 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '신청 처리 중 오류가 발생했습니다',
      details: error.message
    });
  }
}
