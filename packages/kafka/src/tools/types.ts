/** Kafka client interface for testability */
export interface KafkaClient {
  listTopics(): Promise<TopicInfo[]>;
  createTopic(name: string, numPartitions?: number, replicationFactor?: number): Promise<void>;
  deleteTopic(name: string): Promise<void>;
  produceMessage(topic: string, message: string, key?: string, partition?: number): Promise<ProduceResult>;
  consumeMessages(topic: string, groupId: string, maxMessages?: number, fromBeginning?: boolean): Promise<ConsumedMessage[]>;
  describeTopic(name: string): Promise<TopicDetail>;
  listConsumerGroups(): Promise<ConsumerGroupInfo[]>;
  describeConsumerGroup(groupId: string): Promise<ConsumerGroupDetail>;
}

export interface TopicInfo {
  name: string;
  partitions: number;
  replicationFactor: number;
}

export interface TopicDetail {
  name: string;
  partitions: PartitionInfo[];
  configs: Record<string, string>;
}

export interface PartitionInfo {
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[];
  earliestOffset: string;
  latestOffset: string;
}

export interface ProduceResult {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
}

export interface ConsumedMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string;
  timestamp: string;
}

export interface ConsumerGroupInfo {
  groupId: string;
  state: string;
  protocol: string;
}

export interface ConsumerGroupDetail {
  groupId: string;
  state: string;
  members: ConsumerGroupMember[];
  offsets: TopicOffset[];
}

export interface ConsumerGroupMember {
  memberId: string;
  clientId: string;
  host: string;
  assignments: Record<string, number[]>;
}

export interface TopicOffset {
  topic: string;
  partition: number;
  offset: string;
  high: string;
  low: string;
}
