import { Thread, ChannelType, ThreadTag, Message, GoogleReview, DANGER_WORDS, StoreSettings } from '../types';

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Check if text contains danger words
export const hasDangerWords = (text: string): boolean => {
  return DANGER_WORDS.some(word => text.includes(word));
};

// Extract tags from message
const extractTags = (text: string, channel: ChannelType, rating?: number): ThreadTag[] => {
  const tags: ThreadTag[] = [];
  
  if (text.includes('予約') || text.includes('予定')) tags.push('reservation');
  if (text.includes('場所') || text.includes('住所') || text.includes('アクセス')) tags.push('location');
  if (text.includes('営業時間') || text.includes('何時') || text.includes('いつ')) tags.push('hours');
  if (text.includes('駐車') || text.includes('パーキング')) tags.push('parking');
  if (text.includes('メニュー') || text.includes('料金') || text.includes('価格')) tags.push('menu');
  if (text.includes('質問') || text.includes('教えて') || text.includes('知りたい')) tags.push('question');
  
  if (channel === 'GOOGLE' && rating && rating <= 3) tags.push('low_rating');
  if (hasDangerWords(text)) tags.push('danger');
  
  return tags.length > 0 ? tags : ['question'];
};

// Generate AI summary (stub)
export const generateAISummary = (text: string, channel: ChannelType): string => {
  if (hasDangerWords(text)) {
    return 'クレーム疑い。慎重な対応が必要です。';
  }
  
  if (channel === 'LINE') {
    if (text.includes('予約')) return '予約の問い合わせ。日時・人数の確認が必要';
    if (text.includes('営業時間')) return '営業時間についての質問';
    if (text.includes('場所') || text.includes('住所')) return '店舗の場所・アクセスについての質問';
    if (text.includes('駐車')) return '駐車場についての問い合わせ';
    if (text.includes('メニュー') || text.includes('料金')) return '料金・メニューについての質問';
    return '一般的な問い合わせ。内容確認が必要';
  } else {
    // Google review
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }
};

// Generate AI intent
export const generateAIIntent = (text: string, channel: ChannelType, rating?: number): string => {
  if (hasDangerWords(text)) return 'クレーム疑い';
  
  if (channel === 'GOOGLE') {
    if (rating && rating <= 2) return '低評価';
    if (rating && rating === 3) return '中評価';
    return '高評価';
  }
  
  if (text.includes('予約')) return '予約希望';
  if (text.includes('営業時間')) return '営業時間の質問';
  if (text.includes('場所')) return '場所の質問';
  if (text.includes('駐車')) return '駐車場の質問';
  return '一般質問';
};

// Generate AI response (stub)
export const generateAIResponse = (
  text: string, 
  channel: ChannelType, 
  settings: StoreSettings,
  rating?: number
): string => {
  // Danger words -> no auto response
  if (hasDangerWords(text)) {
    return '※危険ワード検出。自動返信は停止しました。手動での対応をお願いします。';
  }
  
  const storeName = settings.storeName || '当店';
  const tone = settings.tone;
  
  if (channel === 'GOOGLE') {
    if (!rating) return '';
    
    // Low ratings -> manual only
    if (rating <= 3) {
      return '※低評価のため自動返信しません。丁寧な個別対応をご検討ください。';
    }
    
    // High ratings
    if (tone === 'polite') {
      return `この度は${storeName}をご利用いただき誠にありがとうございます。お客様からの温かいお言葉を励みに、今後もより良いサービスをご提供できるよう努めてまいります。またのご来店を心よりお待ち申し上げております。`;
    } else if (tone === 'casual') {
      return `${storeName}をご利用いただきありがとうございます！嬉しいお言葉をいただき、スタッフ一同大変励みになります。またぜひお待ちしています！`;
    } else {
      return `${storeName}をご利用いただきありがとうございます。高評価をいただき大変嬉しく思います。またのご来店をお待ちしております。`;
    }
  }
  
  // LINE responses
  if (text.includes('予約')) {
    if (tone === 'polite') {
      return `ご予約のお問い合わせありがとうございます。ご希望の日時、お人数、ご希望のメニューをお教えいただけますでしょうか。`;
    } else if (tone === 'casual') {
      return `ご予約ありがとうございます！希望の日時・人数・メニューを教えてください😊`;
    } else {
      return `ご予約ありがとうございます。希望の日時、人数、メニューを教えてください。`;
    }
  }
  
  if (text.includes('営業時間')) {
    const hours = `${settings.businessHours.start}〜${settings.businessHours.end}`;
    if (tone === 'polite') {
      return `お問い合わせありがとうございます。営業時間は${hours}でございます。何かご不明な点がございましたらお気軽にお尋ねください。`;
    } else if (tone === 'casual') {
      return `営業時間は${hours}です！お待ちしています😊`;
    } else {
      return `営業時間は${hours}です。よろしくお願いいたします。`;
    }
  }
  
  if (text.includes('場所') || text.includes('住所')) {
    if (tone === 'polite') {
      return `お問い合わせありがとうございます。店舗の住所・アクセス情報はプロフィールをご確認ください。ご不明な点がございましたらお気軽にお尋ねください。`;
    } else if (tone === 'casual') {
      return `場所はプロフィール欄に載せています！わからないことがあれば聞いてくださいね😊`;
    } else {
      return `店舗の場所はプロフィール欄をご確認ください。不明点があればお知らせください。`;
    }
  }
  
  if (tone === 'polite') {
    return `お問い合わせいただきありがとうございます。詳しい内容をお伺いしてもよろしいでしょうか。`;
  } else if (tone === 'casual') {
    return `お問い合わせありがとうございます！もう少し詳しく教えてもらえますか？😊`;
  } else {
    return `お問い合わせありがとうございます。詳しい内容を教えてください。`;
  }
};

// Determine initial status based on content and rules
export const determineInitialStatus = (
  channel: ChannelType,
  text: string,
  rating?: number,
  settings?: StoreSettings
): 'unhandled' | 'review' => {
  // Danger words -> always review
  if (hasDangerWords(text)) return 'review';
  
  // Google low rating -> always review
  if (channel === 'GOOGLE' && rating && rating <= 3) return 'review';
  
  // High rating with auto-reply enabled -> still needs confirmation
  // (We'll keep it unhandled initially, let user decide to send)
  
  return 'unhandled';
};

// Generate demo LINE thread
export const generateDemoLINEThread = (
  content: string,
  userName: string,
  settings: StoreSettings,
  minutesAgo: number = 5
): Thread => {
  const id = generateId();
  const timestamp = new Date(Date.now() - minutesAgo * 60000);
  
  const messages: Message[] = [
    {
      id: generateId(),
      sender: 'user',
      content,
      timestamp,
    }
  ];
  
  const tags = extractTags(content, 'LINE');
  const aiSummary = generateAISummary(content, 'LINE');
  const aiIntent = generateAIIntent(content, 'LINE');
  const aiResponse = generateAIResponse(content, 'LINE', settings);
  const hasDanger = hasDangerWords(content);
  const status = determineInitialStatus('LINE', content, undefined, settings);
  
  return {
    id,
    channel: 'LINE',
    userName,
    status,
    tags,
    lastMessage: content,
    timestamp,
    receivedAt: timestamp,
    aiSummary,
    aiIntent,
    aiResponse,
    messages,
    hasDangerWord: hasDanger,
    isRead: false,
  };
};

// Generate demo Google review thread
export const generateDemoGoogleReview = (
  rating: number,
  comment: string,
  reviewerName: string,
  settings: StoreSettings,
  minutesAgo: number = 10
): Thread => {
  const id = generateId();
  const timestamp = new Date(Date.now() - minutesAgo * 60000);
  
  const review: GoogleReview = {
    rating,
    comment,
    reviewerName,
    timestamp,
  };
  
  const tags = extractTags(comment, 'GOOGLE', rating);
  const aiSummary = generateAISummary(comment, 'GOOGLE');
  const aiIntent = generateAIIntent(comment, 'GOOGLE', rating);
  const aiResponse = generateAIResponse(comment, 'GOOGLE', settings, rating);
  const hasDanger = hasDangerWords(comment);
  const status = determineInitialStatus('GOOGLE', comment, rating, settings);
  
  return {
    id,
    channel: 'GOOGLE',
    userName: reviewerName,
    status,
    tags,
    lastMessage: comment,
    timestamp,
    receivedAt: timestamp,
    aiSummary,
    aiIntent,
    aiResponse,
    googleReview: review,
    hasDangerWord: hasDanger,
    isRead: false,
  };
};

// Initialize demo data
export const initializeDemoData = (settings: StoreSettings): Thread[] => {
  return [
    // LINE demos
    generateDemoLINEThread(
      '明日の19時から2名で予約したいのですが、空いていますか？カット＋カラーでお願いしたいです。',
      '田中 美咲',
      settings,
      5
    ),
    generateDemoLINEThread(
      '営業時間は何時までですか？',
      '佐藤 健太',
      settings,
      15
    ),
    generateDemoLINEThread(
      'お店の場所がよくわからないのですが、最寄り駅からどう行けばいいですか？',
      '鈴木 麻衣',
      settings,
      25
    ),
    generateDemoLINEThread(
      '駐車場はありますか？何台停められますか？',
      '高橋 誠',
      settings,
      45
    ),
    generateDemoLINEThread(
      'この前の施術、全然効果なかったんですけど。返金してもらえますか？詐欺じゃないですか？',
      '山田 太郎',
      settings,
      120
    ),
    generateDemoLINEThread(
      'メニューの料金を教えてください',
      '伊藤 花子',
      settings,
      90
    ),
    
    // Google reviews
    generateDemoGoogleReview(
      5,
      'スタッフの対応が素晴らしく、仕上がりも大満足です！また利用させていただきます。',
      '木村 愛',
      settings,
      30
    ),
    generateDemoGoogleReview(
      5,
      '清潔感のある店内で、リラックスして過ごせました。技術力も高く、おすすめです。',
      '中村 隆',
      settings,
      60
    ),
    generateDemoGoogleReview(
      4,
      '全体的に良かったです。少し待ち時間が長かったのが気になりましたが、満足しています。',
      '小林 由美',
      settings,
      90
    ),
    generateDemoGoogleReview(
      5,
      '友人に紹介されて来店しました。期待以上の仕上がりで感動しました！',
      '加藤 大輔',
      settings,
      150
    ),
    generateDemoGoogleReview(
      2,
      '予約時間に行ったのに30分も待たされた。スタッフの態度も良くなかった。',
      '渡辺 美穂',
      settings,
      180
    ),
    generateDemoGoogleReview(
      4,
      'コスパが良く、技術も確かです。また行きたいと思います。',
      '山本 翔太',
      settings,
      240
    ),
    generateDemoGoogleReview(
      1,
      '施術後に肌が荒れてしまった。説明も不十分で最悪でした。二度と行きません。',
      '松本 真理',
      settings,
      300
    ),
  ];
};
